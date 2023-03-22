// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

/// @title Pixelmon Trainer Adventure Smart Contract
/// @author LiquidX
/// @notice This smart contract provides configuration for the Trainer Adventure event on Pixelmon

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Utils.sol";

/// @notice Thrown when end timestamp is less than equal to start timestamp
error InvalidTimeStamp();
/// @notice Thrown when inputting week number less than equal to the current week number
///         and when the start week number is greater than end week number
error InvalidWeekNumber();
/// @notice Thrown when week duration is less than total period for updating prize and set the winners
error InvalidDuration();
/// @notice Thrown when block.timestamp is less than end timestamp of the current week
///         or more than the start timestamp in the next week
error InvalidUpdationPeriod();
/// @notice Thrown when claiming treasure beyond the schedule
error InvalidClaimingPeriod();
/// @notice Thrown when address has no "Admin" role
error NotAdmin();
/// @notice Thrown when address has no "Moderator" role
error NotModerator();
/// @notice Thrown when length of both arrays are not equal
error InvalidLength();

contract WinnerSelectionManager is Ownable, VRFConsumerBaseV2, Utils {
    /// @notice Amount of random number requested to Chainlink
    uint32 public constant Random_Number_Count = 3;

    /// @notice Struct object to send request to Chainlink
    /// @param fulfilled Whether the random words has been set or not
    /// @param exists Whether the request has been sent or not
    /// @param weekNumber Draw week number
    /// @param randomWords Random words from Chainlink
    struct Request {
        bool fulfilled;
        bool exists;
        uint256 weekNumber;
        uint256[] randomWords;
    }

    /// @notice Struct object for winner information
    /// @param claimLimit Maximum prize that can be claimed by winner
    /// @param claimed Number of prize that has been claimed by winner
    /// @param treasureTypeClaimed Type of prize that is rewarded to the winner.
    ///        'true' means the prize has been claimed by the winner. Otherwise false
    struct Winner {
        uint8 claimLimit;
        uint8 claimed;
        mapping(uint256 => bool) treasureTypeClaimed;
    }

    /// @notice Struct object to store prize information
    /// @dev If the prize is ERC721, leave tokenIds value as empty array
    ///      if the prize is ERC1155, leave tokenId value as dummy
    /// @param collectionAddress Contract address which is the origin of the prize
    /// @param tokenId ERC721 Prize token ID in its Smart Contract
    /// @param tokenIds ERC1155 Prize token ID in its Smart Contract
    /// @param claimedToken Amount of token that has been claimed
    /// @param contractType 1 for ERC1155, 2 for ERC721
    /// @param treasureType Similar like ID for the prize. Prize ID is different
    ///        than token ID, 2 token IDs can have same prize ID. Prize ID is used
    ///        to identify the prize that claimed by winner and it's used to make
    ///        sure the winner will get different set of prizes.
    struct Treasure {
        address collectionAddress;
        uint256 tokenId;
        uint256[] tokenIds;
        uint256 claimedToken;
        uint8 contractType;
        uint8 treasureType;
    }

    /// @notice Struct object to store information about prize that distributed within a week
    /// @param treasureIndex Index of the prize in the smart contract
    /// @param totalSupply Total supply of the prize within a week
    struct TreasureDistribution {
        uint8 treasureIndex;
        uint16 totalSupply;
    }

    /// @notice Struct object to store week information
    /// @param startTimeStamp Start time of the event in a week
    /// @param ticketDrawTimeStamp Time of the ticket is distributed within a week
    /// @param claimStartTimeStamp Time where the winner can claim the prize
    /// @param endTimeStamp End time of the event in a week
    /// @param remainingSupply The remaining prize supply that hasn't been claimed during
    ///        the week. This supply is the sum of every prize supply excluding Sponsored Trips
    /// @param treasureCount How many prize option available
    /// @param sponsoredTripsCount How many Sponsored Trips available in a week
    /// @param availabletripsCount How many Sponsored Trips prize that has not been claimed
    /// @param randomNumbers Chainlink random seed
    /// @param tripWinners Winner of Sponsored Trips
    /// @param tripWinnersMap Map that contains address of the Sponsored Trips winner.
    ///        Map is used to easily validate whether the address is a winner rather than
    ///        iterating every index in a list/array to find a winner
    /// @param distributions Map of prize that is distributed during the week
    /// @param winners List of winner of the week
    struct Week {
        uint256 startTimeStamp;
        uint256 ticketDrawTimeStamp;
        uint256 claimStartTimeStamp;
        uint256 endTimeStamp;
        uint256 remainingSupply;
        uint8 treasureCount;
        uint8 sponsoredTripsCount;
        uint8 availabletripsCount;
        uint256[] randomNumbers;
        address[] tripWinners;
        mapping(address => bool) tripWinnersMap;
        mapping(uint256 => TreasureDistribution) distributions;
        mapping(address => Winner) winners;
    }

    /// @notice Struct object for week information
    /// @dev This struct is only used as return type for getWeekInfo method
    /// @param startTimeStamp Start time of the event in a week
    /// @param ticketDrawTimeStamp Time of the ticket is distributed within a week
    /// @param claimStartTimeStamp Time where the winner can claim the prize
    /// @param endTimeStamp End time of the event in a week
    /// @param remainingSupply The remaining prize supply that hasn't been claimed during
    ///        the week. This supply is the sum of every prize supply excluding Sponsored Trips
    /// @param treasureCount How many prize option available
    /// @param sponsoredTripsCount How many Sponsored Trips available in a week
    /// @param randomNumbers Chainlink random seed
    /// @param tripWinners Winner of Sponsored Trips
    /// @param availabletripsCount How many Sponsored Trips prize that has not been claimed
    struct WeekData {
        uint256[] randomNumbers;
        address[] tripWinners;
    }

    /// @notice Collection of information for each week
    mapping(uint256 => Week) public weekInfos;

    /// @notice List of address that has "Admin" role, 'true' means it has the privilege
    mapping(address => bool) public adminWallets;
    /// @notice List of address that has "Moderator" role, 'true' means it has the privilege
    mapping(address => bool) public moderatorWallets;

    /// @notice The maximum gas price to pay for a request to Chainlink in wei.
    bytes32 public keyHash;
    /// @notice How many confirmations the Chainlink node should wait before responding
    uint16 requestConfirmations = 3;
    /// @notice Chainlink subscription ID that used for sending request
    uint64 public chainLinkSubscriptionId;
    /// @notice Gas limit used to call Chainlink
    uint32 public callbackGasLimit = 400000;
    /// @notice Address that is able to call Chainlink
    VRFCoordinatorV2Interface internal COORDINATOR;
    /// @notice Last request ID to Chainlink
    uint256 public lastRequestId;
    /// @notice Collection of chainink request ID
    uint256[] public requestIds;
    /// @notice Map of request to Chainlink
    mapping(uint256 => Request) public requests;

    /// @notice Check whether address has "Admin" role
    /// @param _walletAddress Valid ethereum address
    modifier onlyAdmin(address _walletAddress) {
        if (!adminWallets[_walletAddress]) {
            revert NotAdmin();
        }
        _;
    }

    /// @notice Check whether address has "Moderator" role
    /// @param _walletAddress Valid ethereum address
    modifier onlyModerator(address _walletAddress) {
        if (!moderatorWallets[_walletAddress]) {
            revert NotModerator();
        }
        _;
    }

    /// @notice Check whether block.timestamp is within the schedule
    ///         to set prize distribution
    /// @param _weekNumber Number of the week
    modifier validTreaureDistributionPeriod(uint256 _weekNumber) {
        if (!(block.timestamp >= weekInfos[_weekNumber].startTimeStamp && block.timestamp < weekInfos[_weekNumber].ticketDrawTimeStamp)) {
            revert InvalidUpdationPeriod();
        }
        _;
    }

    /// @notice Check whether block.timestamp is beyond the schedule
    ///         to update winner merkle root and chainlink
    /// @param _weekNumber Number of the week
    modifier validWinnerUpdationPeriod(uint256 _weekNumber) {
        if (!(block.timestamp >= weekInfos[_weekNumber].ticketDrawTimeStamp && block.timestamp < weekInfos[_weekNumber].claimStartTimeStamp)) {
            revert InvalidUpdationPeriod();
        }
        _;
    }

  

    /// @notice Emit when calling fulfillRandomWords function
    /// @param weekNumber The week number when the request is sent to Chainlink
    /// @param RandomWords The input random words
    event ChainlinkRandomNumberSet(uint256 weekNumber, uint256[] RandomWords);

    /// @notice Emit when winners of the week has been selected
    /// @param weekNumber The week number
    /// @param tripWinners The winner for Sponsored Trips prize
    event WeeklyWinnersSet(uint256 weekNumber, address[] tripWinners);

    /// @notice Constructor function
    /// @param _vrfCoordinator The address of the Chainlink VRF Coordinator contract
    /// @param _chainLinkSubscriptionId The Chainlink Subscription ID that is funded to use VRF
    /// @param _keyHash The gas lane to use, which specifies the maximum gas price to bump to.
    ///        More https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    constructor(address _vrfCoordinator, uint64 _chainLinkSubscriptionId, bytes32 _keyHash) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    /// @notice Set "Admin" role for specific address, 'true' means it has privilege
    /// @dev Only owner can call this method
    /// @param _walletAddress The address that will be set as admin
    /// @param _flag 'true' means the address is an admin
    function setAdminWallet(address _walletAddress, bool _flag) external onlyOwner {
        adminWallets[_walletAddress] = _flag;
    }

    /// @notice Set "Moderator" role for specific address, 'true' means it has privilege
    /// @dev Only owner can call this method
    /// @param _walletAddress The address that will be set as moderator
    /// @param _flag 'true' means the address is a moderator
    function setModeratorWallet(address _walletAddress, bool _flag) external onlyOwner {
        moderatorWallets[_walletAddress] = _flag;
    }

    /// @notice Set callback gas limit parameter when sending request to Chainlink
    /// @param _callbackGasLimit Amount of expected gas limit
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyAdmin(msg.sender) {
        callbackGasLimit = _callbackGasLimit;
    }

    /// @notice Set keyHash parameter when sending request to Chainlink
    /// @param _keyHash key Hash for chain link
    function setChainLinkKeyHash(bytes32 _keyHash) external onlyAdmin(msg.sender) {
        keyHash = _keyHash;
    }

    /// @notice Set chainLinkSubscriptionId parameter when sending request to Chainlink
    /// @param _chainLinkSubscriptionId Chainlink subscription Id
    function setChainlinkSubscriptionId(uint64 _chainLinkSubscriptionId) external onlyAdmin(msg.sender) {
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    /// @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    /// @return requestId Chainlink requestId
    function generateChainLinkRandomNumbers(
        uint256 _weekNumber
    ) external onlyModerator(msg.sender) validWinnerUpdationPeriod(_weekNumber) returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(keyHash, chainLinkSubscriptionId, requestConfirmations, callbackGasLimit, Random_Number_Count);
        requests[requestId] = Request({randomWords: new uint256[](0), exists: true, fulfilled: false, weekNumber: _weekNumber});
        requestIds.push(requestId);
        lastRequestId = requestId;
        return requestId;
    }

    /// @notice Store random words in a contract
    /// @param _requestId Chainlink request ID
    /// @param _randomWords A collection of random word
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(requests[_requestId].exists, "request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;
        weekInfos[requests[_requestId].weekNumber].randomNumbers = _randomWords;
        emit ChainlinkRandomNumberSet(requests[_requestId].weekNumber, _randomWords);
    }

    
    /// @notice Set the week information related with timestamp
    /// @param _startTimeStamp The start time of the event
    /// @param _prizeUpdationDuration Duration to update the prize in pool
    /// @param _winnerUpdationDuration Duration to update winner in merkle root
    /// @param _weeklyDuration How long the event will be held within a week
    function setWeeklyTimeStamp(
        uint256 _startWeek,
        uint256 _endWeek,
        uint256 _startTimeStamp,
        uint256 _prizeUpdationDuration,
        uint256 _winnerUpdationDuration,
        uint256 _weeklyDuration
    ) external onlyAdmin(msg.sender) {
        if (_weeklyDuration <= (_prizeUpdationDuration + _winnerUpdationDuration)) {
            revert InvalidDuration();
        }
        for (uint256 index = _startWeek; index <= _endWeek; index = _uncheckedInc(index)) {
            weekInfos[index].startTimeStamp = _startTimeStamp;
            weekInfos[index].ticketDrawTimeStamp = _startTimeStamp + _prizeUpdationDuration;
            weekInfos[index].claimStartTimeStamp = _startTimeStamp + _prizeUpdationDuration + _winnerUpdationDuration;
            weekInfos[index].endTimeStamp = _startTimeStamp + _weeklyDuration - 1;
            _startTimeStamp += _weeklyDuration;
        }
    }

    /// @notice Get week informations for specific week
    /// @param _weekNumber The number of the week
    /// @return week Information for specific week
    function getWeekInfo(uint256 _weekNumber) external view returns (WeekData memory week) {
        week.randomNumbers = weekInfos[_weekNumber].randomNumbers;
        week.tripWinners = weekInfos[_weekNumber].tripWinners;
        
    }

    function getWeeklyClaimedCount(uint256 _weekNumber, address _walletAddress) external view returns (uint8 count) {
        return weekInfos[_weekNumber].winners[_walletAddress].claimed;
    }

    function getWeeklyDistribution(uint256 _weekNumber, uint256 _index) external view returns (TreasureDistribution memory data) {
        return weekInfos[_weekNumber].distributions[_index];
    }
    
}

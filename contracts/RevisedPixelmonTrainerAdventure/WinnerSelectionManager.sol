// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

/// @title Pixelmon Trainer Adventure Smart Contract
/// @author LiquidX
/// @notice This smart contract provides configuration for the Trainer Adventure event on Pixelmon

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @notice Thrown when end timestamp is less than equal to start timestamp
error InvalidTimeStamp();
/// @notice Thrown when inputting week number less than equal to the current week number
///         and when the start week number is greater than end week number
error InvalidWeekNumber();
/// @notice Thrown when inputting invalid merkel root
error InvalidMerkleRoot();
/// @notice Thrown when overridding existing merkle root
error MerkleRootAlreadySet();
/// @notice Thrown when claiming duration is less than a week
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

contract WinnerSelectionManager is Ownable, VRFConsumerBaseV2 {
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
    ///         to update pool
    /// @param _weekNumber Number of the week
    modifier validPoolUpdationPeriod(uint256 _weekNumber) {
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

    /// @notice Check whether the input week number is valid
    /// @param _weekNumber Number of the week
    modifier validWeekNumber(uint256 _weekNumber) {
        if (_weekNumber == 0 || _weekNumber > totalWeek) {
            revert InvalidWeekNumber();
        }
        _;
    }

    /// @notice Amount of random number requested to Chainlink
    uint32 public constant Random_Number_Count = 3;
    /// @notice Total week to claim treasure
    uint256 public totalWeek;
    /// @notice Struct object that provides information regarding the week
    struct WeekInfo {
        bytes32 winnersMerkleRoot;
        uint256[] randomNumbers;
        uint256 startTimeStamp;
        uint256 ticketDrawTimeStamp;
        uint256 claimStartTimeStamp;
        uint256 endTimeStamp;
        mapping(address => bool) claimed;
    }
    /// @notice Similar with WeekInfo but omit `claimed` mapping
    struct WeekData {
        bytes32 winnersMerkleRoot;
        uint256[] randomNumbers;
        uint256 startTimeStamp;
        uint256 ticketDrawTimeStamp;
        uint256 claimStartTimeStamp;
        uint256 endTimeStamp;
    }
    /// @notice Collection of information for each week
    mapping(uint256 => WeekInfo) public weekInfos;
    /// @notice List of address that has "Admin" role, 'true' means it has the privilege
    mapping(address => bool) public adminWallets;
    /// @notice List of address that has "Moderator" role, 'true' means it has the privilege
    mapping(address => bool) public moderatorWallets;
    /// @notice Struct object to send request to Chainlink
    struct Request {
        bool fulfilled;
        bool exists;
        uint256 weekNumber;
        uint256[] randomWords;
    }
    /// @notice Map of request to Chainlink
    mapping(uint256 => Request) public requests;
    /// @notice Collection of chainink request ID
    uint256[] public requestIds;
    /// @notice Last request ID to Chainlink
    uint256 public lastRequestId;
    /// @notice Gas limit used to call Chainlink
    uint32 public callbackGasLimit = 2500000;
    /// @notice Address that is able to call Chainlink
    VRFCoordinatorV2Interface internal COORDINATOR;

    /// @notice How many confirmations the Chainlink node should wait before responding
    uint16 requestConfirmations = 3;
    /// @notice Chainlink subscription ID that used for sending request
    uint64 public chainLinkSubscriptionId;
    /// @notice The maximum gas price to pay for a request to Chainlink in wei.
    bytes32 public keyHash;

    /// @notice Emit when calling setMerkleRoot function
    /// @param weekNumber The current week number
    /// @param MerkleRoot The input merkle root
    event SetWinnerMerkelRoot(uint256 weekNumber, bytes32 MerkleRoot);
    /// @notice Emit when calling updateMerkleRoot function
    /// @param weekNumber The specified week number
    /// @param MerkleRoot The input merkle root
    event UpdateWinnerMerkelRoot(uint256 weekNumber, bytes32 MerkleRoot);
    /// @notice Emit when calling fulfillRandomWords function
    /// @param weekNumber The week number when the request is sent to Chainlink
    /// @param RandomWords The input random words
    event ChainlinkRandomNumberSet(uint256 weekNumber, uint256[] RandomWords);

    constructor(address _vrfCoordinator, uint64 _chainLinkSubscriptionId, bytes32 _keyHash) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    /// @notice Set "Admin" role for specific address, 'true' means it has privilege
    /// @dev Only owner can call this method
    function setAdminWallet(address _walletAddress, bool _flag) external onlyOwner {
        adminWallets[_walletAddress] = _flag;
    }

    /// @notice Set "Moderator" role for specific address, 'true' means it has privilege
    /// @dev Only owner can call this method
    function setModeratorWallet(address _walletAddress, bool _flag) external onlyOwner {
        moderatorWallets[_walletAddress] = _flag;
    }

    // @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    /// @return requestId Chainlink requestId
    function generateChainLinkRandomNumbers(
        uint256 _weekNumber
    ) external onlyModerator(msg.sender) validWinnerUpdationPeriod(_weekNumber) validWeekNumber(_weekNumber) returns (uint256 requestId) {
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
    /// @param _chainLinkSubscriptionId chainlink subcription Id
    function setChainlinkSubscriptionId(uint64 _chainLinkSubscriptionId) external onlyAdmin(msg.sender) {
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    /// @notice Set merkle root for the winner of the week
    /// @dev Only moderator can call this method
    /// @param _weekNumber Number of the week
    /// @param merkle The merkle root
    function setMerkleRoot(
        uint256 _weekNumber,
        bytes32 merkle
    ) external onlyModerator(msg.sender) validWeekNumber(_weekNumber) validWinnerUpdationPeriod(_weekNumber) {
        if (merkle[0] == 0) {
            revert InvalidMerkleRoot();
        }

        if (weekInfos[_weekNumber].winnersMerkleRoot[0] != 0) {
            revert MerkleRootAlreadySet();
        }
        weekInfos[_weekNumber].winnersMerkleRoot = merkle;

        emit SetWinnerMerkelRoot(_weekNumber, merkle);
    }

    /// @notice Set merkle root for the winner
    /// @dev Only moderator can call this method
    /// @param _weekNumber The week number of the merkle root that will be overridden
    /// @param merkle The merkle root
    function updateMerkleRoot(uint256 _weekNumber, bytes32 merkle) external onlyModerator(msg.sender) validWeekNumber(_weekNumber) {
        if (merkle[0] == 0) {
            revert InvalidMerkleRoot();
        }
        weekInfos[_weekNumber].winnersMerkleRoot = merkle;
        emit UpdateWinnerMerkelRoot(_weekNumber, merkle);
    }

    /// @notice Update the week information related with timestamp
    /// @param _weekNumber Number of the week
    /// @param _startTimeStamp The start time of the event
    /// @param _prizeUpdationDuration Duration to update the prize in pool
    /// @param _winnerUpdationDuration Duration to update winner in merkle root
    /// @param _weeklyDuration How long the event will be held within a week
    function updateWeekTimeStamp(
        uint256 _weekNumber,
        uint256 _startTimeStamp,
        uint256 _prizeUpdationDuration,
        uint256 _winnerUpdationDuration,
        uint256 _weeklyDuration
    ) external onlyAdmin(msg.sender) validWeekNumber(_weekNumber) {
        if (_weeklyDuration <= (_prizeUpdationDuration + _winnerUpdationDuration)) {
            revert InvalidDuration();
        }
        if (_weekNumber != 1 && _startTimeStamp <= weekInfos[_weekNumber - 1].endTimeStamp) {
            revert InvalidTimeStamp();
        }
        if (_weekNumber != totalWeek && _startTimeStamp + _weeklyDuration - 1 >= weekInfos[_weekNumber + 1].startTimeStamp) {
            revert InvalidTimeStamp();
        }

        weekInfos[_weekNumber].startTimeStamp = _startTimeStamp;
        weekInfos[_weekNumber].ticketDrawTimeStamp = _startTimeStamp + _prizeUpdationDuration;
        weekInfos[_weekNumber].claimStartTimeStamp = _startTimeStamp + _prizeUpdationDuration + _winnerUpdationDuration;
        weekInfos[_weekNumber].endTimeStamp = _startTimeStamp + _weeklyDuration - 1;
    }

    /// @notice Set the week information related with timestamp
    /// @param _numberOfWeeks How many weeks the event will be held
    /// @param _startTimeStamp The start time of the event
    /// @param _prizeUpdationDuration Duration to update the prize in pool
    /// @param _winnerUpdationDuration Duration to update winner in merkle root
    /// @param _weeklyDuration How long the event will be held within a week
    function setWeeklyTimeStamp(
        uint256 _numberOfWeeks,
        uint256 _startTimeStamp,
        uint256 _prizeUpdationDuration,
        uint256 _winnerUpdationDuration,
        uint256 _weeklyDuration
    ) external onlyAdmin(msg.sender) {
        if (_weeklyDuration <= (_prizeUpdationDuration + _winnerUpdationDuration)) {
            revert InvalidDuration();
        }
        for (uint256 index = 0; index < _numberOfWeeks; index++) {
            totalWeek++;
            weekInfos[totalWeek].startTimeStamp = _startTimeStamp;
            weekInfos[totalWeek].ticketDrawTimeStamp = _startTimeStamp + _prizeUpdationDuration;
            weekInfos[totalWeek].claimStartTimeStamp = _startTimeStamp + _prizeUpdationDuration + _winnerUpdationDuration;
            weekInfos[totalWeek].endTimeStamp = _startTimeStamp + _weeklyDuration - 1;
            _startTimeStamp += _weeklyDuration;
        }
    }

    /// @notice Get week informations for specific week
    /// @param _weekNumber The number of the week
    function getWeekInfo(uint256 _weekNumber) external view returns (WeekData memory week) {
        week.startTimeStamp = weekInfos[_weekNumber].startTimeStamp;
        week.ticketDrawTimeStamp = weekInfos[_weekNumber].ticketDrawTimeStamp;
        week.claimStartTimeStamp = weekInfos[_weekNumber].claimStartTimeStamp;
        week.endTimeStamp = weekInfos[_weekNumber].endTimeStamp;
        week.winnersMerkleRoot = weekInfos[_weekNumber].winnersMerkleRoot;
        week.randomNumbers = weekInfos[_weekNumber].randomNumbers;
    }
}

// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

/// @title Pixelmon Trainer Adventure Smart Contract
/// @author LiquidX
/// @notice This smart contract provides configuration for the Trainer Adventure event on Pixelmon
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPxChainlinkManager.sol";
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

contract WinnerSelectionManager is Ownable, Utils {
    
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
        address[] tripWinners;
        mapping(address => bool) tripWinnersMap;
        mapping(uint256 => TreasureDistribution) distributions;
        mapping(address => Winner) winners;
    }

    /// @notice Struct object for week information
    /// @dev This struct is only used as return type for getWeekInfo method
    /// @param tripWinners Winner of Sponsored Trips
    struct WeekData {
        address[] tripWinners;
        uint256[] randomNumbers;
    }

    /// @notice Total prize options
    uint256 public totalTreasureCount;

    /// @notice Variable to store prize information such as the collection
    ///         address, token ID, amount, and token type
    /// @custom:key prize ID
    /// @custom:value Prize information
    mapping(uint256 => Treasure) public treasures;

    /// @notice Total week to claim treasure
    uint256 public totalWeek;
    /// @notice Collection of information for each week
    mapping(uint256 => Week) public weekInfos;

    /// @notice List of address that has "Admin" role, 'true' means it has the privilege
    mapping(address => bool) public adminWallets;
    /// @notice List of address that has "Moderator" role, 'true' means it has the privilege
    mapping(address => bool) public moderatorWallets;

    /// @dev Signature Contract
    IPxChainlinkManager public pxChainlinkManagerContract;

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

    /// @notice Check whether the input week number is valid
    /// @param _weekNumber Number of the week
    modifier validWeekNumber(uint256 _weekNumber) {
        if (_weekNumber == 0 || _weekNumber > totalWeek) {
            revert InvalidWeekNumber();
        }
        _;
    }

    /// @notice Emit when winners of the week has been selected
    /// @param weekNumber The week number
    /// @param tripWinners The winner for Sponsored Trips prize
    event WeeklyWinnersSet(uint256 weekNumber, address[] tripWinners);

    /// @notice Constructor function
    constructor() {}

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

    /// @notice Update the week information related with timestamp
    /// @param _weekNumber Number of the week
    /// @param _startTimeStamp The start time of the event
    /// @param _prizeUpdationDuration Duration to update the prize in pool
    /// @param _winnerUpdationDuration Duration to update winner in merkle root
    /// @param _weeklyDuration How long the event will be held within a week
    function updateWeeklyTimeStamp(
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
        for (uint256 index = 0; index < _numberOfWeeks; index = _uncheckedInc(index)) {
            totalWeek++;
            weekInfos[totalWeek].startTimeStamp = _startTimeStamp;
            weekInfos[totalWeek].ticketDrawTimeStamp = _startTimeStamp + _prizeUpdationDuration;
            weekInfos[totalWeek].claimStartTimeStamp = _startTimeStamp + _prizeUpdationDuration + _winnerUpdationDuration;
            weekInfos[totalWeek].endTimeStamp = _startTimeStamp + _weeklyDuration - 1;
            _startTimeStamp += _weeklyDuration;
        }
    }

    // @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    function generateChainLinkRandomNumbers(uint256 _weekNumber) external onlyModerator(msg.sender) validWinnerUpdationPeriod(_weekNumber) {
        pxChainlinkManagerContract.generateChainLinkRandomNumbers(_weekNumber);
    }

    /// @notice Get week informations for specific week
    /// @param _weekNumber The number of the week
    /// @return week Information for specific week
    function getWeekInfo(uint256 _weekNumber) external view returns (WeekData memory week) {
        week.tripWinners = weekInfos[_weekNumber].tripWinners;
        week.randomNumbers = pxChainlinkManagerContract.getWeeklyRandomNumbers(_weekNumber);
    }

    function getWeeklyClaimedCount(uint256 _weekNumber, address _walletAddress) external view returns (uint8 count) {
        return weekInfos[_weekNumber].winners[_walletAddress].claimed;
    }

    function getWeeklyDistributions(uint256 _weekNumber) external view returns (TreasureDistribution[] memory tmp) {
        TreasureDistribution[] memory distributions = new TreasureDistribution[](weekInfos[_weekNumber].treasureCount);
        for (uint256 index = 0; index < weekInfos[_weekNumber].treasureCount; index++) {
            distributions[index] = weekInfos[_weekNumber].distributions[index];
        }
        return distributions;
    }

    function getTreasures() external view returns (Treasure[] memory tmp) {
        Treasure[] memory allTreasures = new Treasure[](totalTreasureCount);
        for (uint256 index = 0; index < totalTreasureCount; index++) {
            allTreasures[index] = treasures[index];
        }
        return allTreasures;
    }
}

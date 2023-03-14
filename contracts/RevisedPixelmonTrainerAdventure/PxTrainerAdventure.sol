// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Utils.sol";

error InvalidDuration();
error NotAWinner();
error ALreadyClaimed();
error InvalidWeekNumber();
error InvalidTimeStamp();

contract PxTrainerAdventure is Utils, ReentrancyGuard, VRFConsumerBaseV2, Ownable {
    modifier validWeekNumber(uint256 _weekNumber) {
        if (_weekNumber == 0 || _weekNumber > totalWeek) {
            revert InvalidWeekNumber();
        }
        _;
    }
    uint256 public constant ERC_1155_TYPE = 1;
    uint256 public constant ERC_721_TYPE = 2;
    uint32 public constant Random_Number_Count = 3;
    struct Week {
        uint256[] randomNumbers;
        address[] sponsoredTripWinners;
        uint256 startTimeStamp;
        uint256 ticketDrawTimeStamp;
        uint256 claimStartTimeStamp;
        uint256 endTimeStamp;
        mapping(address => Winner) winners;
        uint256 remainingSupply;
        uint256 treasureCount;
        mapping(uint256 => TreasureDistribution) distributions;
    }

    struct WeekData {
        bytes32 winnersMerkleRoot;
        uint256[] randomNumbers;
        uint256 startTimeStamp;
        uint256 ticketDrawTimeStamp;
        uint256 claimStartTimeStamp;
        uint256 endTimeStamp;
    }

    struct Winner {
        uint256 claimLimit;
        uint256 claimed;
        mapping(uint256 => bool) claimedTreasureType;
    }

    struct TreasureDistribution {
        uint256 treasureIndex;
        uint256 maxSupply;
        uint256 totalSupply;
    }

    mapping(uint256 => Week) public weekInfos;

    struct Treasure {
        address collectionAddress;
        uint256 tokenId;
        uint256 contractType;
        uint256 treasureType;
    }
    address public vaultWalletAddress;
    uint256 public totalWeek;
    uint256 public totalTreasures;
    mapping(uint256 => Treasure) public treasures;

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

    event ChainlinkRandomNumberSet(uint256 weekNumber, uint256[] RandomWords);

    event WeeklyWinnersSet(uint256 weekNumber, address[] SponsoredTripWinners);

    constructor(address _vrfCoordinator, uint64 _chainLinkSubscriptionId, bytes32 _keyHash) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    function addTreasure(Treasure calldata treasure) external {
        totalTreasures++;
        treasures[totalTreasures] = treasure;
    }

    function claimTreasure(uint256 weekNumber) external {
        Week storage week = weekInfos[weekNumber];
        if (week.winners[msg.sender].claimLimit == 0) {
            revert NotAWinner();
        }
        if (week.winners[msg.sender].claimed == weekInfos[weekNumber].winners[msg.sender].claimLimit) {
            revert ALreadyClaimed();
        }
        if (week.winners[msg.sender].claimed == 0) {
            firstClaim(weekNumber);
        } else {
            multiClaim(weekNumber);
        }
    }

    function multiClaim(uint256 weekNumber) internal {
        Week storage week = weekInfos[weekNumber];
        uint256 remaining;
        uint256 altRemaining;

        for (uint256 index = 1; index <= week.treasureCount; index++) {
            if (week.winners[msg.sender].claimedTreasureType[treasures[week.distributions[index].treasureIndex].treasureType]) {
                altRemaining += week.distributions[index].totalSupply;
            } else {
                remaining += week.distributions[index].totalSupply;
            }
        }
        uint256 randomNumber = getRandomNumber();

        uint256 selectedIndex;
        uint256 sumOfTotalSupply;
        if (altRemaining == week.remainingSupply) {
            uint256 random = randomNumber - ((randomNumber / altRemaining) * altRemaining) + 1;
            for (uint256 index = 1; index <= week.treasureCount; index++) {
                if (
                    week.distributions[index].totalSupply == 0 ||
                    !week.winners[msg.sender].claimedTreasureType[treasures[week.distributions[index].treasureIndex].treasureType]
                ) {
                    continue;
                }
                sumOfTotalSupply += week.distributions[index].totalSupply;
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        } else {
            uint256 random = randomNumber - ((randomNumber / remaining) * remaining) + 1;

            for (uint256 index = 1; index <= week.treasureCount; index++) {
                if (
                    week.distributions[index].totalSupply == 0 ||
                    week.winners[msg.sender].claimedTreasureType[treasures[week.distributions[index].treasureIndex].treasureType]
                ) {
                    continue;
                }
                sumOfTotalSupply += week.distributions[index].totalSupply;
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        }

        uint256 selectedTreasureIndex = week.distributions[selectedIndex].treasureIndex;
        week.distributions[selectedIndex].totalSupply--;
        week.winners[msg.sender].claimedTreasureType[treasures[selectedTreasureIndex].treasureType] = true;
        week.winners[msg.sender].claimed++;
        week.remainingSupply--;

        transferToken(
            treasures[selectedTreasureIndex].collectionAddress,
            treasures[selectedTreasureIndex].contractType,
            msg.sender,
            treasures[selectedTreasureIndex].tokenId
        );
    }

    function firstClaim(uint256 weekNumber) internal {
        Week storage week = weekInfos[weekNumber];
        uint256 randomNumber = getRandomNumber();
        uint256 random = randomNumber - ((randomNumber / week.remainingSupply) * week.remainingSupply) + 1;

        uint256 selectedIndex;
        uint256 sumOfTotalSupply;

        for (uint256 index = 1; index <= week.treasureCount; index++) {
            if (week.distributions[index].totalSupply == 0) {
                continue;
            }
            sumOfTotalSupply += week.distributions[index].totalSupply;
            if (random <= sumOfTotalSupply) {
                selectedIndex = index;
                break;
            }
        }
        uint256 selectedTreasureIndex = week.distributions[selectedIndex].treasureIndex;
        week.distributions[selectedIndex].totalSupply--;
        week.winners[msg.sender].claimedTreasureType[treasures[selectedTreasureIndex].treasureType] = true;
        week.winners[msg.sender].claimed++;
        week.remainingSupply--;

        transferToken(
            treasures[selectedTreasureIndex].collectionAddress,
            treasures[selectedTreasureIndex].contractType,
            msg.sender,
            treasures[selectedTreasureIndex].tokenId
        );
    }

    function transferToken(address _collection, uint256 _type, address _to, uint256 _id) internal {
        if (_type == ERC_1155_TYPE) {
            IERC1155 erc1155Contract = IERC1155(_collection);
            erc1155Contract.safeTransferFrom(vaultWalletAddress, _to, _id, 1, "");
        }
        if (_type == ERC_721_TYPE) {
            IERC721 erc721Contract = IERC721(_collection);
            erc721Contract.transferFrom(vaultWalletAddress, _to, _id);
        }
    }

    function updateWeeklyWinners(uint256 weekNumber, address[] calldata winners, uint256[] calldata counts) external {
        for (uint256 index = 0; index < winners.length; index++) {
            weekInfos[weekNumber].winners[winners[index]].claimLimit = counts[index];
        }
        address[] memory sponsoredTripWinners;
        emit WeeklyWinnersSet(weekNumber, sponsoredTripWinners);
    }

    function updateWeeklyTreasureDistribution(uint256 weekNumber, uint256[] calldata treasureindexes, uint256[] calldata counts) external {
        Week storage week = weekInfos[weekNumber];

        for (uint256 index = 0; index < treasureindexes.length; index++) {
            week.treasureCount++;
            week.distributions[week.treasureCount].treasureIndex = treasureindexes[index];
            week.distributions[week.treasureCount].maxSupply = counts[index];
            week.distributions[week.treasureCount].totalSupply = counts[index];
            week.remainingSupply += counts[index];
        }
    }

    function setWeeklyTimeStamp(
        uint256 _numberOfWeeks,
        uint256 _startTimeStamp,
        uint256 _prizeUpdationDuration,
        uint256 _winnerUpdationDuration,
        uint256 _weeklyDuration
    ) external {
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

    function updateWeekTimeStamp(
        uint256 _weekNumber,
        uint256 _startTimeStamp,
        uint256 _prizeUpdationDuration,
        uint256 _winnerUpdationDuration,
        uint256 _weeklyDuration
    ) external validWeekNumber(_weekNumber) {
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

    function getWeekInfo(uint256 _weekNumber) external view returns (WeekData memory week) {
        week.startTimeStamp = weekInfos[_weekNumber].startTimeStamp;
        week.ticketDrawTimeStamp = weekInfos[_weekNumber].ticketDrawTimeStamp;
        week.claimStartTimeStamp = weekInfos[_weekNumber].claimStartTimeStamp;
        week.endTimeStamp = weekInfos[_weekNumber].endTimeStamp;
        week.randomNumbers = weekInfos[_weekNumber].randomNumbers;
    }

    function updateVaultWalletAddress(address walletAddress) external {
        vaultWalletAddress = walletAddress;
    }

    // @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    /// @return requestId Chainlink requestId
    function generateChainLinkRandomNumbers(uint256 _weekNumber) external validWeekNumber(_weekNumber) returns (uint256 requestId) {
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
    function setCallbackGasLimit(uint32 _callbackGasLimit) external {
        callbackGasLimit = _callbackGasLimit;
    }

    /// @notice Set keyHash parameter when sending request to Chainlink
    /// @param _keyHash key Hash for chain link
    function setChainLinkKeyHash(bytes32 _keyHash) external {
        keyHash = _keyHash;
    }

    /// @notice Set chainLinkSubscriptionId parameter when sending request to Chainlink
    /// @param _chainLinkSubscriptionId chainlink subcription Id
    function setChainlinkSubscriptionId(uint64 _chainLinkSubscriptionId) external {
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }
}

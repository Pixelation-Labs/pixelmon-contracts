// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./WinnerSelectionManager.sol";
import "./Utils.sol";

/// @notice Thrown when treasure is already claimed by the same user in the same week
error ALreadyClaimed();
/// @notice Thrown when address is not part of the winner Merkle Tree
error NotAWinner();
error InvalidInput();
error InvalidTreasureIndex();
error InsufficientToken();
error NotEnoughWinnersForSponsoredTrip();

contract PxTrainerAdventure is WinnerSelectionManager, Utils, ReentrancyGuard {
    uint256 public constant ERC_1155_TYPE = 1;
    uint256 public constant ERC_721_TYPE = 2;

    address public vaultWalletAddress;

    uint256 public claimIndexCount;
    uint256 public totalTreasures;
    Treasure public sponsoredTrip;
    mapping(uint256 => Treasure) public treasures;
    mapping(address => bool) public sponsoredTripWinners;

    event TreasureTransferred(
        uint256 weekNumber,
        uint256 requestId,
        address userWallet,
        address collectionAddress,
        uint256 tokenId,
        uint256 tokenType,
        uint256 randomNumber
    );

    constructor(
        address _vrfCoordinator,
        uint64 _chainLinkSubscriptionId,
        bytes32 _keyHash
    ) WinnerSelectionManager(_vrfCoordinator, _chainLinkSubscriptionId, _keyHash) {}

    function setVaultWalletAddress(address _walletAddress) external onlyOwner {
        vaultWalletAddress = _walletAddress;
    }

    function addTreasures(Treasure memory _treasure) external onlyAdmin(msg.sender) {
        totalTreasures++;
        if (_treasure.claimedToken != 0 || (_treasure.contractType != 1 && _treasure.contractType != 2)) {
            revert InvalidInput();
        }
        if ((_treasure.contractType == 1 && _treasure.tokenIds.length > 0) || (_treasure.contractType == 2 && _treasure.tokenIds.length == 0)) {
            revert InvalidInput();
        }
        treasures[totalTreasures] = _treasure;
    }

    function addSponsoredTripTreasure(Treasure memory _treasure) external onlyAdmin(msg.sender) {
        if (_treasure.claimedToken != 0 || _treasure.contractType != 1 || _treasure.tokenIds.length > 0) {
            revert InvalidInput();
        }
        sponsoredTrip = _treasure;
    }

    function claimTreasure(uint256 _weekNumber) external nonReentrant noContracts {
        if (!(block.timestamp >= weekInfos[_weekNumber].claimStartTimeStamp && block.timestamp <= weekInfos[_weekNumber].endTimeStamp)) {
            revert InvalidClaimingPeriod();
        }
        Week storage week = weekInfos[_weekNumber];
        if (week.winners[msg.sender].claimLimit == 0) {
            revert NotAWinner();
        }
        if (week.winners[msg.sender].claimed == weekInfos[_weekNumber].winners[msg.sender].claimLimit) {
            revert ALreadyClaimed();
        }
        if (week.winners[msg.sender].claimed == 0) {
            primaryClaim(_weekNumber);
        } else {
            secondaryClaim(_weekNumber);
        }
    }

    function primaryClaim(uint256 _weekNumber) internal {
        Week storage week = weekInfos[_weekNumber];
        if (week.tripWinnersMap[msg.sender]) {
            sponsoredTripWinners[msg.sender] = true;
            week.tripWinnersMap[msg.sender] = false;
            week.winners[msg.sender].claimed++;
            week.availabletripsCount--;
            sponsoredTrip.claimedToken++;
            claimIndexCount++;
            transferToken(sponsoredTrip);
            claimIndexCount++;
            emit TreasureTransferred(
                _weekNumber,
                claimIndexCount,
                msg.sender,
                sponsoredTrip.collectionAddress,
                sponsoredTrip.tokenId,
                sponsoredTrip.contractType,
                0
            );
        } else {
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
            week.winners[msg.sender].treasureTypeClaimed[treasures[selectedTreasureIndex].treasureType] = true;
            week.winners[msg.sender].claimed++;
            week.remainingSupply--;
            claimIndexCount++;
            treasures[selectedTreasureIndex].claimedToken++;

            transferToken(treasures[selectedTreasureIndex]);

            emit TreasureTransferred(
                _weekNumber,
                claimIndexCount,
                msg.sender,
                treasures[selectedTreasureIndex].collectionAddress,
                treasures[selectedTreasureIndex].tokenId,
                treasures[selectedTreasureIndex].contractType,
                randomNumber
            );
        }
    }

    function secondaryClaim(uint256 _weekNumber) internal {
        Week storage week = weekInfos[_weekNumber];
        uint256 remaining;
        uint256 altRemaining;

        for (uint256 index = 1; index <= week.treasureCount; index++) {
            uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
            if (week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
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
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                if (week.distributions[index].totalSupply == 0 || !week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
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
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                if (week.distributions[index].totalSupply == 0 || week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
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
        week.winners[msg.sender].treasureTypeClaimed[treasures[selectedTreasureIndex].treasureType] = true;
        week.winners[msg.sender].claimed++;
        week.remainingSupply--;
        treasures[selectedTreasureIndex].claimedToken++;
        transferToken(treasures[selectedTreasureIndex]);
        emit TreasureTransferred(
            _weekNumber,
            claimIndexCount,
            msg.sender,
            treasures[selectedTreasureIndex].collectionAddress,
            treasures[selectedTreasureIndex].tokenId,
            treasures[selectedTreasureIndex].contractType,
            randomNumber
        );
    }

    function transferToken(Treasure memory _treasure) internal {
        if (_treasure.contractType == ERC_1155_TYPE) {
            IERC1155 erc1155Contract = IERC1155(_treasure.collectionAddress);
            erc1155Contract.safeTransferFrom(vaultWalletAddress, msg.sender, _treasure.tokenId, 1, "");
        }
        if (_treasure.contractType == ERC_721_TYPE) {
            IERC721 erc721Contract = IERC721(_treasure.collectionAddress);
            if (_treasure.tokenIds.length == _treasure.claimedToken) {
                revert InsufficientToken();
            }
            erc721Contract.transferFrom(vaultWalletAddress, msg.sender, _treasure.tokenIds[_treasure.claimedToken - 1]);
        }
    }

    function setWeeklyTreasureDistribution(
        uint256 _weekNumber,
        uint256[] memory _treasureindexes,
        uint256[] memory _counts
    ) external onlyAdmin(msg.sender) validTreaureDistributionPeriod(_weekNumber) validArrayLength(_treasureindexes.length, _counts.length) {
        Week storage week = weekInfos[_weekNumber];

        for (uint256 index = 0; index < _treasureindexes.length; index++) {
            if (_treasureindexes[index] == 0 || _treasureindexes[index] > totalTreasures) {
                revert InvalidTreasureIndex();
            }
            week.treasureCount++;
            week.distributions[week.treasureCount].treasureIndex = _treasureindexes[index];
            week.distributions[week.treasureCount].totalSupply = _counts[index];
            week.remainingSupply += _counts[index];
        }
    }

    function setWeeklySponsoredTripDistribution(
        uint256 _weekNumber,
        uint256 _count
    ) external onlyAdmin(msg.sender) validTreaureDistributionPeriod(_weekNumber) {
        weekInfos[_weekNumber].sponsoredTripsCount = _count;
        weekInfos[_weekNumber].availabletripsCount = _count;
    }

    function updateWeeklyWinners(
        uint256 _weekNumber,
        address[] memory _winners,
        uint8[] memory _counts
    )
        external
        onlyModerator(msg.sender)
        validWeekNumber(_weekNumber)
        validArrayLength(_winners.length, _counts.length)
        validWinnerUpdationPeriod(_weekNumber)
    {
        uint256 randomNumber = getRandomNumber();
        uint256 index = randomNumber - ((randomNumber / _counts.length) * _counts.length);
        uint256 counter = 0;
        uint256 tripCount = 0;
        address[] memory tmp = new address[](weekInfos[_weekNumber].sponsoredTripsCount);
        while (counter < _counts.length) {
            if (index == _counts.length) {
                index = 0;
            }
            if (sponsoredTripWinners[_winners[index]] == false && tripCount < weekInfos[_weekNumber].sponsoredTripsCount) {
                weekInfos[_weekNumber].tripWinnersMap[_winners[index]] = true;
                tmp[tripCount] = _winners[index];
                tripCount++;
            }
            weekInfos[_weekNumber].winners[_winners[index]].claimLimit = _counts[index];

            index++;
            counter++;
        }
        if (tripCount < weekInfos[_weekNumber].sponsoredTripsCount) {
            revert NotEnoughWinnersForSponsoredTrip();
        }
        weekInfos[_weekNumber].tripWinners = tmp;

        emit WeeklyWinnersSet(_weekNumber, tmp);
    }

    function setSponsoredTripWinnerMap(
        address[] memory _previousWinners,
        bool[] memory _flags
    ) external onlyAdmin(msg.sender) validArrayLength(_previousWinners.length, _flags.length) {
        for (uint256 index = 0; index < _flags.length; index++) {
            sponsoredTripWinners[_previousWinners[index]] = _flags[index];
        }
    }
}

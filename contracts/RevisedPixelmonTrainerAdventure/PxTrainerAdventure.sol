// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./WinnerSelectionManager.sol";
import "./IPxChainlinkManager.sol";

/// @notice Thrown when all prizes are already claimed
error AlreadyClaimed();
/// @notice Thrown when address is not a winner
error NotAWinner();
/// @notice Thrown when input is not as expected condition
error InvalidInput();
/// @notice Thrown when inputting non-exist treasure index
error InvalidTreasureIndex();
/// @notice Thrown when no available prizes to be transferred to the winner
error InsufficientToken();
/// @notice Thrown when the input signature is invalid.
error InvalidSignature();

contract PxTrainerAdventure is WinnerSelectionManager {
    /// @notice code number for ERC1155 token
    uint8 public constant ERC_1155_TYPE = 1;
    /// @notice code number for ERC721 token
    uint8 public constant ERC_721_TYPE = 2;

    /// @notice Wallet address that keeps all prizes
    address public vaultWalletAddress;

    /// @notice Total prize options
    uint256 public totalTreasureCount;
    /// @notice Variable to store Sponsored Trips prize information such
    ///         as the collection address, token ID, amount, and token type
    Treasure public sponsoredTrip;
    /// @notice Variable to store prize information such as the collection
    ///         address, token ID, amount, and token type
    /// @custom:key prize ID
    /// @custom:value Prize information
    mapping(uint256 => Treasure) public treasures;
    /// @notice List of address who owns Sponsored Trips
    /// @custom:key wallet address
    /// @custom:value 'true' means already own Sponsored Trips
    mapping(address => bool) public sponsoredTripWinners;

    /// @notice Check whether both array input has the same length
    /// @param length1 First length of the array input
    /// @param length2 Second length of the array input
    modifier validArrayLength(uint256 length1, uint256 length2) {
        if (length1 != length2) {
            revert InvalidLength();
        }
        _;
    }

    /// @notice Emit when a prize is claimed
    /// @param weekNumber Week number when the prize is claimed
    /// @param userWallet Wallet address who claims the prize
    /// @param collectionAddress The origin address of the prize
    /// @param tokenId The prize token ID in its origin address
    /// @param tokenType The token type in its origin address
    event TreasureTransferred(uint256 weekNumber, address userWallet, address collectionAddress, uint256 tokenId, uint256 tokenType);

    /// @notice The contract constructor
    /// @dev The constructor parameters only used as input
    ///      from WinnerSelectionManager contract
    ///        More https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    /// @param _pxChainlinkContractAddress Signature contract address
    constructor(address _pxChainlinkContractAddress) WinnerSelectionManager() {
        pxChainlinkManagerContract = IPxChainlinkManager(_pxChainlinkContractAddress);
    }

    function setpxChainlinkManagerContractAddress(address _pxChainlinkContractAddress) external onlyOwner {
        pxChainlinkManagerContract = IPxChainlinkManager(_pxChainlinkContractAddress);
    }

    /// @notice Set address to become vault
    /// @param _walletAddress Wallet address that will be the vault
    function setVaultWalletAddress(address _walletAddress) external onlyOwner {
        vaultWalletAddress = _walletAddress;
    }

    function addTreasures(Treasure memory _treasure) external onlyAdmin(msg.sender) {
        totalTreasureCount++;
        if (_treasure.claimedToken != 0 || (_treasure.contractType != ERC_1155_TYPE && _treasure.contractType != ERC_721_TYPE)) {
            revert InvalidInput();
        }
        if (
            (_treasure.contractType == ERC_1155_TYPE && _treasure.tokenIds.length > 0) ||
            (_treasure.contractType == ERC_721_TYPE && _treasure.tokenIds.length == 0)
        ) {
            revert InvalidInput();
        }
        treasures[totalTreasureCount] = _treasure;
    }

    function updateTreasures(uint256 _index, Treasure memory _treasure) external onlyAdmin(msg.sender) {
        treasures[_index] = _treasure;
    }

    /// @notice Add Sponsored Trips prize to the smart contract
    /// @dev Can only be called by administrators
    /// @param _treasure Sponsored Trips information according to Treasure struct
    function addSponsoredTripTreasure(Treasure memory _treasure) external onlyAdmin(msg.sender) {
        if (_treasure.claimedToken != 0 || _treasure.contractType != ERC_1155_TYPE || _treasure.tokenIds.length > 0) {
            revert InvalidInput();
        }
        sponsoredTrip = _treasure;
    }

    /// @notice Claim prize for winner
    /// @dev Only winner of the week can call this method
    /// @param _weekNumber The week number to claim prize
    /// @param _signature Signature from signer wallet
    function claimTreasure(uint256 _weekNumber, bytes calldata _signature) external noContracts {
        if (!(block.timestamp >= weekInfos[_weekNumber].claimStartTimeStamp && block.timestamp <= weekInfos[_weekNumber].endTimeStamp)) {
            revert InvalidClaimingPeriod();
        }
        bool isValidSigner = pxChainlinkManagerContract.recoverSignerFromSignature(
            _weekNumber,
            weekInfos[_weekNumber].winners[msg.sender].claimed,
            msg.sender,
            _signature
        );

        if (!isValidSigner) {
            revert InvalidSignature();
        }

        if (weekInfos[_weekNumber].winners[msg.sender].claimLimit == 0) {
            revert NotAWinner();
        }
        if (weekInfos[_weekNumber].winners[msg.sender].claimed == weekInfos[_weekNumber].winners[msg.sender].claimLimit) {
            revert AlreadyClaimed();
        }
        if (weekInfos[_weekNumber].winners[msg.sender].claimed == 0) {
            primaryClaim(_weekNumber);
        } else {
            secondaryClaim(_weekNumber);
        }
    }

    /// @notice Method to claim the first prize
    /// @dev This method is also used to claim Sponsor Trips if
    ///      the winner selected to get one
    /// @param _weekNumber The week number to claim prize
    function primaryClaim(uint256 _weekNumber) internal {
        Week storage week = weekInfos[_weekNumber];
        if (week.tripWinnersMap[msg.sender]) {
            sponsoredTripWinners[msg.sender] = true;
            week.tripWinnersMap[msg.sender] = false;

            unchecked {
                week.winners[msg.sender].claimed++;
                week.availabletripsCount--;
                sponsoredTrip.claimedToken++;
            }
            transferToken(_weekNumber, sponsoredTrip);
        } else {
            uint256 randomNumber = getRandomNumber();
            uint256 random = randomNumber - ((randomNumber / week.remainingSupply) * week.remainingSupply) + 1;

            uint256 selectedIndex;
            uint16 sumOfTotalSupply;

            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                if (week.distributions[index].totalSupply == 0) {
                    continue;
                }
                unchecked {
                    sumOfTotalSupply += week.distributions[index].totalSupply;
                }
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
            uint256 selectedTreasureIndex = week.distributions[selectedIndex].treasureIndex;
            week.winners[msg.sender].treasureTypeClaimed[treasures[selectedTreasureIndex].treasureType] = true;

            unchecked {
                week.distributions[selectedIndex].totalSupply--;
                week.winners[msg.sender].claimed++;
                week.remainingSupply--;
                treasures[selectedTreasureIndex].claimedToken++;
            }

            transferToken(_weekNumber, treasures[selectedTreasureIndex]);
        }
    }

    /// @notice Method to claim the next prize
    /// @dev This method will give different prizes than the first
    ///      one if there still other prize option available
    /// @param _weekNumber The week number to claim prize
    function secondaryClaim(uint256 _weekNumber) internal {
        Week storage week = weekInfos[_weekNumber];
        uint16 remaining;
        uint16 altRemaining;

        for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
            uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
            if (week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
                unchecked {
                    altRemaining += week.distributions[index].totalSupply;
                }
            } else {
                unchecked {
                    remaining += week.distributions[index].totalSupply;
                }
            }
        }
        uint256 randomNumber = getRandomNumber();

        uint256 selectedIndex;
        uint256 sumOfTotalSupply;
        if (altRemaining == week.remainingSupply) {
            uint256 random = randomNumber - ((randomNumber / altRemaining) * altRemaining) + 1;
            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                if (week.distributions[index].totalSupply == 0 || !week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
                    continue;
                }
                unchecked {
                    sumOfTotalSupply += week.distributions[index].totalSupply;
                }
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        } else {
            uint256 random = randomNumber - ((randomNumber / remaining) * remaining) + 1;

            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                if (week.distributions[index].totalSupply == 0 || week.winners[msg.sender].treasureTypeClaimed[treasureType]) {
                    continue;
                }
                unchecked {
                    sumOfTotalSupply += week.distributions[index].totalSupply;
                }
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        }

        uint256 selectedTreasureIndex = week.distributions[selectedIndex].treasureIndex;
        week.winners[msg.sender].treasureTypeClaimed[treasures[selectedTreasureIndex].treasureType] = true;
        unchecked {
            week.distributions[selectedIndex].totalSupply--;
            week.winners[msg.sender].claimed++;
            week.remainingSupply--;
            treasures[selectedTreasureIndex].claimedToken++;
        }

        transferToken(_weekNumber, treasures[selectedTreasureIndex]);
    }

    /// @notice Transfer token from vault to the method caller's wallet address
    /// @dev This method will be used in a public method and user who call the
    ///      method will get a token from vault
    /// @param _treasure Prize to transfer
    function transferToken(uint256 _weekNumber, Treasure memory _treasure) internal {
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

        emit TreasureTransferred(_weekNumber, msg.sender, _treasure.collectionAddress, _treasure.tokenId, _treasure.contractType);
    }

    /// @notice Set prize that will be awarded to the winner of the week
    /// @dev Only admin can call this method
    /// @param _weekNumber The week number
    /// @param _treasureindexes The index of the treasure in 'treasures' mapping variable
    /// @param _treasureCounts Amount of treasure that will be available to claim during the week
    function setWeeklyTreasureDistribution(
        uint256 _weekNumber,
        uint8[] memory _treasureindexes,
        uint16[] memory _treasureCounts,
        uint8 _sponsoredTripsCount
    ) external onlyAdmin(msg.sender) validTreaureDistributionPeriod(_weekNumber) validArrayLength(_treasureindexes.length, _treasureCounts.length) {
        Week storage week = weekInfos[_weekNumber];
        week.sponsoredTripsCount = _sponsoredTripsCount;
        week.availabletripsCount = _sponsoredTripsCount;
        week.treasureCount = 0;
        for (uint256 index = 0; index < _treasureindexes.length; index = _uncheckedInc(index)) {
            if (_treasureindexes[index] == 0 || _treasureindexes[index] > totalTreasureCount) {
                revert InvalidTreasureIndex();
            }
            week.treasureCount++;
            week.distributions[week.treasureCount].treasureIndex = _treasureindexes[index];
            week.distributions[week.treasureCount].totalSupply = _treasureCounts[index];
            week.remainingSupply += _treasureCounts[index];
        }
    }

    /// @notice Set a list of winner for a particular week
    /// @param _weekNumber The current week number
    /// @param _winners List of wallet addresses that have been selected as winners
    /// @param _treasureCounts Amount of prize that have been awarded to the corresponding winner
    function updateWeeklyWinners(
        uint256 _weekNumber,
        address[] memory _winners,
        uint8[] memory _treasureCounts
    ) external onlyModerator(msg.sender) validArrayLength(_winners.length, _treasureCounts.length) validWinnerUpdationPeriod(_weekNumber) {
        uint256 randomNumber = getRandomNumber();
        uint256 randomIndex = randomNumber - ((randomNumber / _treasureCounts.length) * _treasureCounts.length);
        uint256 counter = 0;
        uint256 tripWinnerCount = 0;
        uint256 treasureCount = 0;
        address[] memory tmpTripWinner = new address[](weekInfos[_weekNumber].sponsoredTripsCount);
        while (counter < _treasureCounts.length) {
            if (randomIndex == _treasureCounts.length) {
                randomIndex = 0;
            }
            if (
                !sponsoredTripWinners[_winners[randomIndex]] &&
                tripWinnerCount < weekInfos[_weekNumber].sponsoredTripsCount &&
                _treasureCounts[randomIndex] > 0
            ) {
                weekInfos[_weekNumber].tripWinnersMap[_winners[randomIndex]] = true;
                tmpTripWinner[tripWinnerCount] = _winners[randomIndex];
                tripWinnerCount++;
            }

            weekInfos[_weekNumber].winners[_winners[randomIndex]].claimLimit = _treasureCounts[randomIndex];
            treasureCount += _treasureCounts[randomIndex];
            unchecked {
                randomIndex++;
                counter++;
            }
        }
        if (treasureCount > weekInfos[_weekNumber].remainingSupply + weekInfos[_weekNumber].sponsoredTripsCount) {
            revert("Invalid Treasure Amount");
        }

        weekInfos[_weekNumber].tripWinners = tmpTripWinner;
        emit WeeklyWinnersSet(_weekNumber, tmpTripWinner);
    }

    /// @notice Add a list of wallet addresses that has already owned Sponsored Trip
    /// @param _previousWinners List of addresses that has already owned Sponsored Trip
    /// @param _flags 'true' means already owned
    function setSponsoredTripWinnerMap(
        address[] memory _previousWinners,
        bool[] memory _flags
    ) external onlyAdmin(msg.sender) validArrayLength(_previousWinners.length, _flags.length) {
        for (uint256 index = 0; index < _flags.length; index = _uncheckedInc(index)) {
            sponsoredTripWinners[_previousWinners[index]] = _flags[index];
        }
    }

    function reSetSponsoredTripWinner(uint256 _weekNumber, address _winner) external onlyAdmin(msg.sender) validWinnerUpdationPeriod(_weekNumber) {
        weekInfos[_weekNumber].tripWinnersMap[_winner] = false;
    }

    function getTreasureById(uint256 _index) external view returns (Treasure memory treasure) {
        return treasures[_index];
    }
}

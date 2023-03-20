// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./WinnerSelectionManager.sol";
import "./IPxTrainerAdventureSignature.sol";
import "./Utils.sol";

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
/// @notice Thrown when not enough winner to be selected to get Sponsored Trips
error NotEnoughWinnersForSponsoredTrip();
/// @notice Thrown when the input signature is invalid.
error InvalidSignature();

contract PxTrainerAdventure is WinnerSelectionManager, Utils, ReentrancyGuard {
    /// @notice code number for ERC1155 token
    uint256 public constant ERC_1155_TYPE = 1;
    /// @notice code number for ERC721 token
    uint256 public constant ERC_721_TYPE = 2;

    
    /// @dev Signer wallet address for signature verification
    address public SIGNER;

    /// @dev Signature Contract Address
    IPxTrainerAdventureSignature public SIGNATURE_CONTRACT;

    /// @notice Wallet address that keeps all prizes
    address public vaultWalletAddress;

    /// @notice Claim ID
    /// @dev This can be used to track the claimed prize
    uint256 public claimIndexCount;
    /// @notice Total prize options
    uint256 public totalTreasures;
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

    /// @notice Emit when a prize is claimed
    /// @dev The requestId input can use the value of claimIndexCount
    /// @param weekNumber Week number when the prize is claimed
    /// @param requestId Claim ID
    /// @param userWallet Wallet address who claims the prize
    /// @param collectionAddress The origin address of the prize
    /// @param tokenId The prize token ID in its origin address
    /// @param tokenType The token type in its origin address
    /// @param randomNumber The random number generated when claiming the prize
    event TreasureTransferred(
        uint256 weekNumber,
        uint256 requestId,
        address userWallet,
        address collectionAddress,
        uint256 tokenId,
        uint256 tokenType,
        uint256 randomNumber
    );

    /// @notice The contract constructor
    /// @dev The constructor parameters only used as input
    ///      from WinnerSelectionManager contract
    /// @param _vrfCoordinator The address of the Chainlink VRF Coordinator contract
    /// @param _chainLinkSubscriptionId The Chainlink Subscription ID that is funded to use VRF
    /// @param _keyHash The gas lane to use, which specifies the maximum gas price to bump to.
    ///        More https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    /// @param _signer Signer wallet address for signature verification
    /// @param _signer Signer wallet address for signature verification
    constructor(
        address _vrfCoordinator,
        uint64 _chainLinkSubscriptionId,
        bytes32 _keyHash,
        address _signer,
        address _pxSignatureAddress
    ) WinnerSelectionManager(_vrfCoordinator, _chainLinkSubscriptionId, _keyHash) {
        SIGNER = _signer;
        SIGNATURE_CONTRACT = IPxTrainerAdventureSignature(_pxSignatureAddress);
    }

    /// @notice Sets Signer wallet address
    /// @dev This function can only be executed by the contract owner
    /// @param signer Signer wallet address for signature verifition
    function setSignerAddress(address signer) external onlyOwner {
        SIGNER = signer;
    }

    function setSignatureContractAddress(address _pxSignatureAddress) external onlyOwner {
        SIGNATURE_CONTRACT = IPxTrainerAdventureSignature(_pxSignatureAddress);
    }

    /// @notice Set address to become vault
    /// @param _walletAddress Wallet address that will be the vault
    function setVaultWalletAddress(address _walletAddress) external onlyOwner {
        vaultWalletAddress = _walletAddress;
    }

    /// @notice Add prize to the smart contract
    /// @dev Only admin can call this method
    /// @param _treasure Prize information according to Treasure struct
    function addTreasures(Treasure memory _treasure) external onlyAdmin(msg.sender) {
        totalTreasures++;
        if (_treasure.claimedToken != 0 || (_treasure.contractType != ERC_1155_TYPE && _treasure.contractType != ERC_721_TYPE)) {
            revert InvalidInput();
        }
        if ((_treasure.contractType == ERC_1155_TYPE && _treasure.tokenIds.length > 0) || (_treasure.contractType == ERC_721_TYPE && _treasure.tokenIds.length == 0)) {
            revert InvalidInput();
        }
        treasures[totalTreasures] = _treasure;
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
    function claimTreasure(uint256 _weekNumber, bytes calldata _signature) external nonReentrant noContracts {
        if (!(block.timestamp >= weekInfos[_weekNumber].claimStartTimeStamp && block.timestamp <= weekInfos[_weekNumber].endTimeStamp)) {
            revert InvalidClaimingPeriod();
        }
        Week storage week = weekInfos[_weekNumber];
        
        address signer = SIGNATURE_CONTRACT.recoverSignerFromSignature(_weekNumber, week.winners[msg.sender].claimed, msg.sender, _signature);
        
        if(signer != SIGNER) {
            revert InvalidSignature();
        }

        if (week.winners[msg.sender].claimLimit == 0) {
            revert NotAWinner();
        }
        if (week.winners[msg.sender].claimed == weekInfos[_weekNumber].winners[msg.sender].claimLimit) {
            revert AlreadyClaimed();
        }
        if (week.winners[msg.sender].claimed == 0) {
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

    /// @notice Method to claim the next prize
    /// @dev This method will give different prizes than the first
    ///      one if there still other prize option available
    /// @param _weekNumber The week number to claim prize
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

    /// @notice Transfer token from vault to the method caller's wallet address
    /// @dev This method will be used in a public method and user who call the
    ///      method will get a token from vault
    /// @param _treasure Prize to transfer
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

    /// @notice Set prize that will be awarded to the winner of the week
    /// @dev Only admin can call this method
    /// @param _weekNumber The week number
    /// @param _treasureindexes The index of the treasure in 'treasures' mapping variable
    /// @param _counts Amount of treasure that will be available to claim during the week
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

    /// @notice Set amount of Sponsored Trips prize that will be awarded to the winner of the week
    /// @param _weekNumber The week number
    /// @param _count Amount of Sponsored Trips that will be distributed during the week
    function setWeeklySponsoredTripDistribution(
        uint256 _weekNumber,
        uint256 _count
    ) external onlyAdmin(msg.sender) validTreaureDistributionPeriod(_weekNumber) {
        weekInfos[_weekNumber].sponsoredTripsCount = _count;
        weekInfos[_weekNumber].availabletripsCount = _count;
    }

    /// @notice Set a list of winner of the week
    /// @param _weekNumber The week number
    /// @param _winners List of wallet addresses that become the winner
    /// @param _counts Amount of prize that awarded to the winner
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

    /// @notice Add a list of wallet addresses that already owns Sponsored Trips
    /// @param _previousWinners List of addresses that already owns Sponsored Trips
    /// @param _flags 'true' means already own Sponsored Trips
    function setSponsoredTripWinnerMap(
        address[] memory _previousWinners,
        bool[] memory _flags
    ) external onlyAdmin(msg.sender) validArrayLength(_previousWinners.length, _flags.length) {
        for (uint256 index = 0; index < _flags.length; index++) {
            sponsoredTripWinners[_previousWinners[index]] = _flags[index];
        }
    }
}

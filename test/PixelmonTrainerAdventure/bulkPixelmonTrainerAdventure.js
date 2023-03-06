const { expect } = require("chai");
const hre = require("hardhat");
const { boolean } = require("hardhat/internal/core/params/argumentTypes");
const { deployContract } = require("./deploy");
require("dotenv").config();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
let deployer;
let anonymous;
let newOwnerWallet;
let contract;
let admin;
let moderator;
let minter;
let pixelmonTrainerGear;
let merkleRoot;
let proof;
let mockERC721;
let verifier;
let blockTimeStamp;
let proof1;
let verifier1;
let proof2;
let verifier2;
beforeEach(async function () {
    const {
        deployerWalletUtils,
        minterWalletUtils,
        adminWalletUtils,
        moderatorWalletUtils,
        anonymousWalletUtils,
        newContractOwnerUtils,
        pixelmonTrainerUtils,
        pixelmonTrainerGearContractUtils,
        rootHashUtils,
        hexProofUtils1,
        verifyWalletUtils1,
        hexProofUtils2,
        verifyWalletUtils2,
        mockERC721Utils,
        previousBlockTimeStamp,
    } = await deployContract();

    deployer = deployerWalletUtils;
    anonymous = anonymousWalletUtils;
    newOwnerWallet = newContractOwnerUtils;
    contract = pixelmonTrainerUtils;
    admin = adminWalletUtils;
    moderator = moderatorWalletUtils;
    minter = minterWalletUtils;
    pixelmonTrainerGear = pixelmonTrainerGearContractUtils;
    merkleRoot = rootHashUtils;
    mockERC721 = mockERC721Utils;
    proof1 = hexProofUtils1;
    verifier1 = verifyWalletUtils1;
    proof2 = hexProofUtils2;
    verifier2 = verifyWalletUtils2;
    blockTimeStamp = previousBlockTimeStamp;
});

function addERC721(tokenIds) {
    let tokenData = [];
    for (let i = 0; i < tokenIds.length; i++) {
        tokenData[i] = {
            collectionAddress: mockERC721.address,
            tokenId: tokenIds[i],
            amount: 0,
        };
    }
    return tokenData;
}

function addERC1155(tokenIds, amounts, collection) {
    let tokenData = [];
    for (let i = 0; i < tokenIds.length; i++) {
        tokenData[i] = {
            collectionAddress: collection.address,
            tokenId: tokenIds[i],
            amount: amounts[i],
        };
    }
    return tokenData;
}

describe("Test adding treasure from multiple collection", function () {

    it("owner can emergencyRescue", async function () {
        const AnimeMetaverseReward = await hre.ethers.getContractFactory("AnimeMetaverseReward");
        const PixelmonSponsoredTrips = await hre.ethers.getContractFactory("PixelmonSponsoredTrips");
        const animeMetaverseRewardContract = await AnimeMetaverseReward.deploy();
        const pixelmonSponsoredTripsContract = await PixelmonSponsoredTrips.deploy(40, "");
        await animeMetaverseRewardContract.deployed();
        await pixelmonSponsoredTripsContract.deployed();

        await pixelmonSponsoredTripsContract.setMinterAddress(minter.address, true);
        await animeMetaverseRewardContract.setMinterAddress(minter.address, true);

        await animeMetaverseRewardContract.connect(minter).mint(1, 1, 1, minter.address, 1, 10, "0x");
        await animeMetaverseRewardContract.connect(minter).setApprovalForAll(contract.address, true);

        await pixelmonSponsoredTripsContract.connect(minter).mint(minter.address, 10);
        await pixelmonSponsoredTripsContract.connect(minter).setApprovalForAll(contract.address, true);

        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);

        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4]));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],pixelmonSponsoredTripsContract));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],animeMetaverseRewardContract));
        
        await contract.connect(deployer).emergencyRescue(mockERC721.address, 1, deployer.address, 1, 0);
        await contract.connect(deployer).emergencyRescue(pixelmonSponsoredTripsContract.address, 0, deployer.address, 1, 1);
        await contract.connect(deployer).emergencyRescue(animeMetaverseRewardContract.address, 0, deployer.address, 1, 1);
    });

    it("should rescue treasure from pool", async function () {
        const AnimeMetaverseReward = await hre.ethers.getContractFactory("AnimeMetaverseReward");
        const PixelmonSponsoredTrips = await hre.ethers.getContractFactory("PixelmonSponsoredTrips");
        const animeMetaverseRewardContract = await AnimeMetaverseReward.deploy();
        const pixelmonSponsoredTripsContract = await PixelmonSponsoredTrips.deploy(40, "");
        await animeMetaverseRewardContract.deployed();
        await pixelmonSponsoredTripsContract.deployed();

        await pixelmonSponsoredTripsContract.setMinterAddress(minter.address, true);
        await animeMetaverseRewardContract.setMinterAddress(minter.address, true);

        await animeMetaverseRewardContract.connect(minter).mint(1, 1, 1, minter.address, 1, 10, "0x");
        await animeMetaverseRewardContract.connect(minter).setApprovalForAll(contract.address, true);

        await pixelmonSponsoredTripsContract.connect(minter).mint(minter.address, 10);
        await pixelmonSponsoredTripsContract.connect(minter).setApprovalForAll(contract.address, true);

        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4]));
        let vaultIndexes = [1, 2, 3, 4];

        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await expect(contract.rescueTreasureFromPool(1, 6, 2, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 2, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 0, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 6, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await contract.rescueTreasureFromPool(1, 4, 4, anonymous.address);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);

        await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);
        await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1], [1], pixelmonTrainerGear));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],pixelmonSponsoredTripsContract));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],animeMetaverseRewardContract));
        vaultIndexes = [];
        for (let i = 5; i <= 7; i++) {
            vaultIndexes.push(i);
        }
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);

        await contract.rescueTreasureFromPool(1, 7, 6, anonymous.address);
        await contract.rescueTreasureFromPool(1, 6, 5, anonymous.address);
        await contract.rescueTreasureFromPool(1, 5, 4, anonymous.address);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);
    });

    it("should rescue treasure from vault", async function () {
        const AnimeMetaverseReward = await hre.ethers.getContractFactory("AnimeMetaverseReward");
        const PixelmonSponsoredTrips = await hre.ethers.getContractFactory("PixelmonSponsoredTrips");
        const animeMetaverseRewardContract = await AnimeMetaverseReward.deploy();
        const pixelmonSponsoredTripsContract = await PixelmonSponsoredTrips.deploy(40, "");
        await animeMetaverseRewardContract.deployed();
        await pixelmonSponsoredTripsContract.deployed();

        await pixelmonSponsoredTripsContract.setMinterAddress(minter.address, true);
        await animeMetaverseRewardContract.setMinterAddress(minter.address, true);

        await animeMetaverseRewardContract.connect(minter).mint(1, 1, 1, minter.address, 1, 10, "0x");
        await animeMetaverseRewardContract.connect(minter).setApprovalForAll(contract.address, true);

        await pixelmonSponsoredTripsContract.connect(minter).mint(minter.address, 10);
        await pixelmonSponsoredTripsContract.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);
        await contract.connect(deployer).setAdminWallet(minter.address, true);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        let vaultIndexes = [1, 2, 3, 4];
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await contract.rescueTreasureFromVault(1, 5, anonymous.address);

        await expect(contract.rescueTreasureFromVault(1, 1, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");
        await expect(contract.rescueTreasureFromVault(1, 5, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");
        await expect(contract.rescueTreasureFromVault(1, 9, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");

        await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);
        await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1, 2, 3], [1, 1, 2], pixelmonTrainerGear));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],pixelmonSponsoredTripsContract));
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1],[1],animeMetaverseRewardContract));
        vaultIndexes = [];
        for (let i = 6; i <= 7; i++) {
            vaultIndexes.push(i);
        }
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await contract.rescueTreasureFromVault(1, 10, anonymous.address);
        await contract.rescueTreasureFromVault(1, 11, anonymous.address);
        await contract.rescueTreasureFromVault(1, 12, anonymous.address);
    });
});

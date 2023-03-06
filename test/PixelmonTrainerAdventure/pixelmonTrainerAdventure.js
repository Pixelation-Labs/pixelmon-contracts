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

function addERC1155(tokenIds, amounts) {
    let tokenData = [];
    for (let i = 0; i < tokenIds.length; i++) {
        tokenData[i] = {
            collectionAddress: pixelmonTrainerGear.address,
            tokenId: tokenIds[i],
            amount: amounts[i],
        };
    }
    return tokenData;
}

describe("pixelmon trainer adventure smart contract adding token functionality", function () {
    // for using this unit test the AlreadClaimed checking in the claim function need to be commented
    // it("tested with large number of treasures", async function () {
    //     await contract.connect(deployer).setAdminWallet(admin.address, true);
    //     await contract.connect(deployer).setAdminWallet(minter.address, true);
    //     await contract.connect(deployer).setModeratorWallet(moderator.address, true);
    //     await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);

    //     await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
    //     await mockERC721.connect(minter).setApprovalForAll(contract.address, true);

    //     var date = new Date();
    //     console.log(date);
    //     await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
    //     isModerator = await contract.moderatorWallets(moderator.address);
    //     expect(isModerator).to.be.true;

    //     await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1, 2, 3, 4], [1000, 1000, 1000, 994]));

    //     let vaultIndexes = [];
    //     for (i = 1; i <= 500; i++) {
    //         vaultIndexes.push(i);
    //     }

    //     date = new Date();
    //     console.log(date);

    //     await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 30, 10, 1000);
    //     await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);

    //     await sleep(7000);
    //     await contract.connect(moderator).setMerkleRoot(1, merkleRoot);
    //     await sleep(8000);
    //     poolSize = await contract.treasurePoolSize();
    //     expect(Number(poolSize)).to.equal(500);

    //     availableTreasure = await contract.availableTreasure();
    //     expect(Number(availableTreasure)).to.equal(4000);

    //     for (let i = 0; i < 20; i++) {
    //         await contract.connect(verifier1).claimTreasure(1, proof1);
    //     }

    //     poolSize = await contract.treasurePoolSize();
    //     expect(Number(poolSize)).to.equal(480);
    //     availableTreasure = await contract.availableTreasure();
    //     expect(Number(availableTreasure)).to.equal(3980);
    // });
    it("user should be able to claim treasure", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(deployer).setModeratorWallet(moderator.address, true);
        isModerator = await contract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.true;
        let vaultIndexes = [1, 2, 3, 4];
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 10, 10, 100);
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await sleep(7000);
        await contract.connect(moderator).setMerkleRoot(1, merkleRoot);
        await expect(contract.connect(moderator).setMerkleRoot(1, merkleRoot)).to.be.revertedWithCustomError(contract, "MerkleRootAlreadySet");
        await expect(contract.connect(verifier1).claimTreasure(1, proof1)).to.be.revertedWithCustomError(contract, "InvalidClaimingPeriod");
        await sleep(8000);

        await contract.connect(verifier1).claimTreasure(1, proof1);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);
        availableTreasure = await contract.availableTreasure();
        expect(Number(availableTreasure)).to.equal(5);
        await expect(contract.connect(verifier1).claimTreasure(1, proof1)).to.be.revertedWithCustomError(contract, "ALreadyClaimed");
        await expect(contract.connect(minter).claimTreasure(1, proof1)).to.be.revertedWithCustomError(contract, "NotAWinner");
        await contract.connect(verifier2).claimTreasure(1, proof2);
    });
    it("only admin can add treasure to pool in a valid time", async function () {
        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        let vaultIndexes = [1, 2, 3, 4];
        await expect(contract.connect(anonymous).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "NotAdmin");
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "InvalidUpdationPeriod");
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await contract.connect(minter).removeTreasureFromPoolExternal(1, [1]);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);
    });

    it("can not add more prize than the maximum pool size", async function () {
        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);
        await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1, 2, 3], [10, 10, 10]));
        let vaultIndexes = [];
        for (let i = 0; i < 600; i++) {
            vaultIndexes.push(i);
        }
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "MaximumPoolSizeExceeded");
    
    
    });

    it("onERC1155BatchReceived should be implemented", async function () {
        let hash = await contract.onERC1155BatchReceived(contract.address, contract.address, [], [], "0x00");
        expect(hash).to.equal("0xbc197c81");
    });

    it("can not add prize which are not vault", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4]));
        let vaultIndexes = [1, 2, 3, 4, 5];
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");
        vaultIndexes = [1, 2, 7];
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "TreasureNotAvailable");
        vaultIndexes = [1, 2, 2];
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "TreasureNotAvailable");
        vaultIndexes = [1];
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        vaultIndexes = [1];
        await expect(contract.connect(minter).addTreasuresToPool(1, vaultIndexes)).to.be.revertedWithCustomError(contract, "TreasureNotAvailable");
    });

    it("owner can emergencyRescue", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4]));
        
        await contract.connect(deployer).emergencyRescue(mockERC721.address, 1, deployer.address, 1, 0);
    });

    it("readonly functions should return correct value", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        weeks = await contract.connect(admin).getWeekInfo(1);
        treasure = await contract.connect(admin).getTreasureVaultByIndex(1);
        pool = await contract.connect(admin).getTreasurePoolInfo();

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        data = await contract.getTreasureVaultInfo(mockERC721.address, [1, 2], [1, 2, 3, 4]);
    });

    it("should reset treasure pool function", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        let vaultIndexes = [1, 2, 3, 4];
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await contract.connect(minter).resetTreasurePool(1);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(0);
    });

    it("should remove from pool index", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        let vaultIndexes = [1, 2, 3, 4];

        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await expect(contract.connect(minter).removeTreasureFromPoolExternal(1, [1,2])).to.be.revertedWithCustomError(contract, "NotSorted");
        await expect(contract.connect(minter).removeTreasureFromPoolExternal(1, [0,2])).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");

        await contract.connect(minter).removeTreasureFromPoolExternal(1, [1]);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);
    });

    it("should rescue treasure from pool", async function () {
        await contract.connect(deployer).setAdminWallet(admin.address, true);
        await contract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await mockERC721.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC721TreasuresToVault(addERC721([1, 2, 3, 4, 5, 6]));
        let vaultIndexes = [1, 2, 3, 4];

        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await expect(contract.rescueTreasureFromPool(1, 6, 2, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidVaultIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 2, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 0, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await expect(contract.rescueTreasureFromPool(1, 1, 6, anonymous.address)).to.be.revertedWithCustomError(contract, "InvalidPoolIndex");
        await contract.rescueTreasureFromPool(1, 1, 1, anonymous.address);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(3);

        await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);
        await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1, 2, 3], [1, 1, 2]));
        vaultIndexes = [];
        for (let i = 5; i <= 7; i++) {
            vaultIndexes.push(i);
        }
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);

        await contract.rescueTreasureFromPool(1, 5, 4, anonymous.address);
        poolSize = await contract.treasurePoolSize();
        expect(Number(poolSize)).to.equal(5);
    });

    it("Support interface method test for coverage", async function () {
        let interfaceTest = await contract.supportsInterface("0xd9b67a26");
        expect(interfaceTest).to.be.false;
        interfaceTest = await contract.supportsInterface("0x4e2312e0");
        expect(interfaceTest).to.be.true;
    });

    it("should rescue treasure from vault", async function () {
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
        await contract.connect(minter).addERC1155TreasuresToVault(addERC1155([1, 2, 3], [1, 1, 2]));
        vaultIndexes = [];
        for (let i = 6; i <= 7; i++) {
            vaultIndexes.push(i);
        }
        await contract.connect(minter).addTreasuresToPool(1, vaultIndexes);
        await contract.rescueTreasureFromVault(1, 10, anonymous.address);
    });

    it("Admin will be able to call the addERC1155TreasuresToVault", async function () {
        let tokenData = {
            collectionAddress: pixelmonTrainerGear.address,
            tokenId: 1,
            amount: 5,
        };

        let balance = await pixelmonTrainerGear.balanceOf(minter.address, 1);
        expect(Number(balance)).to.equal(150);
        balance = await pixelmonTrainerGear.balanceOf(contract.address, 1);
        expect(Number(balance)).to.equal(0);
        await expect(contract.connect(minter).addERC1155TreasuresToVault([tokenData])).to.be.revertedWithCustomError(contract, "NotAdmin");

        await contract.connect(deployer).setAdminWallet(minter.address, true);
        await expect(contract.connect(minter).addERC1155TreasuresToVault([tokenData])).to.be.revertedWithCustomError(
            pixelmonTrainerGear,
            "NotAllowedToTransfer"
        );

        await pixelmonTrainerGear.connect(minter).setApprovalForAll(contract.address, true);
        await pixelmonTrainerGear.connect(deployer).setAllowedToTransfer(contract.address, true);
        await contract.connect(minter).addERC1155TreasuresToVault([tokenData]);

        balance = await pixelmonTrainerGear.balanceOf(minter.address, 1);
        expect(Number(balance)).to.equal(145);
        balance = await pixelmonTrainerGear.balanceOf(contract.address, 1);
        expect(Number(balance)).to.equal(5);
    });

    
});

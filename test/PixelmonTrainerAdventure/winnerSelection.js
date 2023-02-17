const { expect } = require("chai");
const hre = require("hardhat");
const { deployContract } = require("./deploy");
require("dotenv").config();

let _vrfCoordinator = process.env.VRF_COORDINATOR;
let _subscriptionId = process.env.SUBSCRIPTION_ID;
let _keyHash = process.env.KEY_HASH;
const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";

describe("winner selection smart contract Functionality", function () {
    let deployer;
    let anonymous;
    let newOwner;
    let trainerAdventureContract;
    let admin;
    let moderator;
    let blockTimeStamp;
    let proof1;
    let verifier1;
    let proof2;
    let verifier2;

    let merkleRoot;

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
            hexProofUtils,
            mockERC721Utils,
            previousBlockTimeStamp,
            hexProofUtils1,
            verifyWalletUtils1,
            hexProofUtils2,
            verifyWalletUtils2,
        } = await deployContract();

        deployer = deployerWalletUtils;
        anonymous = anonymousWalletUtils;
        newOwner = newContractOwnerUtils;
        trainerAdventureContract = pixelmonTrainerUtils;
        admin = adminWalletUtils;
        moderator = moderatorWalletUtils;
        blockTimeStamp = previousBlockTimeStamp;
        merkleRoot = rootHashUtils;
        proof1 = hexProofUtils1;
        verifier1 = verifyWalletUtils1;
        proof2 = hexProofUtils2;
        verifier2 = verifyWalletUtils2;
    });

    it("trainerAdventure contract should be deployed with correct params", async function () {
        const PixelmonTrainerAdventure = await hre.ethers.getContractFactory("PixelmonTrainerAdventure");
        const pixelmonTrainerAdventure = await PixelmonTrainerAdventure.deploy(_vrfCoordinator, _subscriptionId, _keyHash);

        await pixelmonTrainerAdventure.deployed();
    });

    it("chainlink information should be set during deployment", async function () {
        const keyHash = await trainerAdventureContract.keyHash();
        const chainLinkSubscriptionId = await trainerAdventureContract.chainLinkSubscriptionId();

        expect(keyHash).to.equal(_keyHash);
        expect(chainLinkSubscriptionId).to.equal(_subscriptionId);
    });

    it("only admin wallet address should be allowed to set callbackGasLimit", async function () {
        let callbackGasLimit;
        await expect(trainerAdventureContract.connect(anonymous).setCallbackGasLimit(2400000)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.setModeratorWallet(anonymous.address, true);
        await expect(trainerAdventureContract.connect(anonymous).setCallbackGasLimit(2400000)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.setAdminWallet(anonymous.address, true);
        await trainerAdventureContract.connect(anonymous).setCallbackGasLimit(2400000);
        callbackGasLimit = await trainerAdventureContract.callbackGasLimit();
        expect(callbackGasLimit).to.equal(2400000);
    });

    it("onlyModerator will be able to call the set Merkle root", async function () {
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        await trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 0, 200, 500);
        await expect(trainerAdventureContract.connect(moderator).setMerkleRoot(1, merkleRoot)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotModerator"
        );

        await trainerAdventureContract.connect(deployer).setModeratorWallet(moderator.address, true);

        let currentRoot = await trainerAdventureContract.weekInfos(1);
        expect(currentRoot.winnersMerkleRoot).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
        await expect(
            trainerAdventureContract.connect(moderator).setMerkleRoot(1, "0x0000000000000000000000000000000000000000000000000000000000000000")
        ).to.be.revertedWithCustomError(trainerAdventureContract, "InvalidMerkleRoot");
        await trainerAdventureContract.connect(moderator).setMerkleRoot(1, merkleRoot);

        updatedRoot = await trainerAdventureContract.weekInfos(1);
        expect(updatedRoot.winnersMerkleRoot).not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

        let verified = await trainerAdventureContract.connect(verifier1).verify(1, proof1);
        expect(verified).to.be.true;

        verified = await trainerAdventureContract.connect(admin).verify(1, proof1);
        expect(verified).to.be.false;

        await expect(trainerAdventureContract.connect(admin).verify(3, proof1)).to.be.revertedWith("merkle root not set");
    });

    it("onlyModerator will be able to call the update Merkle root", async function () {
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        await trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 0, 200, 500);
        await expect(trainerAdventureContract.connect(moderator).updateMerkleRoot(1, merkleRoot)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotModerator"
        );
        await trainerAdventureContract.connect(deployer).setModeratorWallet(moderator.address, true);
        isModerator = await trainerAdventureContract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.true;

        await expect(
            trainerAdventureContract.connect(moderator).updateMerkleRoot(1, "0x0000000000000000000000000000000000000000000000000000000000000000")
        ).to.be.revertedWithCustomError(trainerAdventureContract, "InvalidMerkleRoot");
        await trainerAdventureContract.connect(moderator).updateMerkleRoot(1, merkleRoot);

        updatedRoot = await trainerAdventureContract.weekInfos(1);
        expect(updatedRoot.winnersMerkleRoot).not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Admin will be able to call the setCallbackGasLimit", async function () {
        let callbackGasLimit = await trainerAdventureContract.callbackGasLimit();
        expect(Number(callbackGasLimit)).to.equal(2500000);

        await expect(trainerAdventureContract.connect(admin).setCallbackGasLimit(1)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);

        await trainerAdventureContract.connect(admin).setCallbackGasLimit(1);
        callbackGasLimit = await trainerAdventureContract.callbackGasLimit();
        expect(Number(callbackGasLimit)).to.equal(1);
    });
    it("Admin will be able to call the setChainlinkSubscriptionId", async function () {
        

        await expect(trainerAdventureContract.connect(admin).setChainlinkSubscriptionId(1)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);

        await trainerAdventureContract.connect(admin).setChainlinkSubscriptionId(1);
        chainLinkSubscriptionId = await trainerAdventureContract.chainLinkSubscriptionId();
        expect(Number(chainLinkSubscriptionId)).to.equal(1);
    });

    it("Admin will be able to call the chain link key hash", async function () {
        
        await expect(trainerAdventureContract.connect(admin).setChainLinkKeyHash("0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c25")).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);

        await trainerAdventureContract.connect(admin).setChainLinkKeyHash("0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c25");
        keyHash = await trainerAdventureContract.keyHash();
        expect(String(keyHash)).to.equal("0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c25");
    });

    it("Admin will be able to call the updateWeekTimeStamp", async function () {
        await expect(trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, blockTimeStamp, 100, 200, 500)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        await trainerAdventureContract.connect(admin).setWeeklyTimeStamp(5, blockTimeStamp, 100, 200, 500);
        await expect(trainerAdventureContract.connect(admin).updateWeekTimeStamp(7, blockTimeStamp, 100, 200, 500)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "InvalidWeekNumber"
        );
        await expect(trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, blockTimeStamp, 100, 200, 3000)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "InvalidTimeStamp"
        );
        await expect(
            trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, blockTimeStamp - 10000, 100, 200, 500)
        ).to.be.revertedWithCustomError(trainerAdventureContract, "InvalidTimeStamp");

        await expect(
            trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, blockTimeStamp - 10000, 100, 200, 300)
        ).to.be.revertedWithCustomError(trainerAdventureContract, "InvalidDuration");
        
        let nextWeekInfo = await trainerAdventureContract.weekInfos(3);

        await expect(
            trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, Number(nextWeekInfo.endTimeStamp) + 10000, 100, 200, 500)
        ).to.be.revertedWithCustomError(trainerAdventureContract, "InvalidTimeStamp");

        trainerAdventureContract.connect(admin).updateWeekTimeStamp(2, blockTimeStamp + 600, 100, 100, 300);
    });

    it("Admin will be able to call the setWeeklyTimeStamp", async function () {
        await expect(trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 0, 200, 500)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotAdmin"
        );
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        await expect(trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 200)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "InvalidDuration"
        );
        await trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 100, 200, 500);
    });

    it("Moderator will be able to call the generateChainLinkRandomNumbers", async function () {
        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        await trainerAdventureContract.connect(deployer).setModeratorWallet(moderator.address, true);

        
        isModerator = await trainerAdventureContract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.true;

        await expect(trainerAdventureContract.connect(moderator).generateChainLinkRandomNumbers(1)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "InvalidUpdationPeriod"
        );

        await trainerAdventureContract.connect(admin).setWeeklyTimeStamp(1, blockTimeStamp, 0, 200, 500);

        await expect(trainerAdventureContract.connect(deployer).generateChainLinkRandomNumbers(1)).to.be.revertedWithCustomError(
            trainerAdventureContract,
            "NotModerator"
        );

        await trainerAdventureContract.connect(moderator).generateChainLinkRandomNumbers(1);

        let weekInfo = await trainerAdventureContract.getWeekInfo(1);
        let randomNumbers = weekInfo.randomNumbers;
        expect(randomNumbers.length).to.equal(3);

        for (let i = 0; i < randomNumbers.length; i++) {
            let randomNumber = Number(randomNumbers[i]);
            expect(randomNumber).to.be.greaterThan(0);
        }
    });

    it("Owner will be able to call the setModeratorWallet", async function () {
        await expect(trainerAdventureContract.connect(moderator).setModeratorWallet(moderator.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await expect(trainerAdventureContract.connect(admin).setModeratorWallet(moderator.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
        let isModerator = await trainerAdventureContract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.false;

        await trainerAdventureContract.connect(deployer).setModeratorWallet(moderator.address, true);
        isModerator = await trainerAdventureContract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.true;

        await trainerAdventureContract.connect(deployer).setModeratorWallet(moderator.address, false);
        isModerator = await trainerAdventureContract.moderatorWallets(moderator.address);
        expect(isModerator).to.be.false;
    });

    it("Owner will be able to call the setAdminWallet", async function () {
        await expect(trainerAdventureContract.connect(admin).setAdminWallet(admin.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
        let isAdmin = await trainerAdventureContract.adminWallets(admin.address);
        expect(isAdmin).to.be.false;

        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, true);
        isAdmin = await trainerAdventureContract.adminWallets(admin.address);
        expect(isAdmin).to.be.true;

        await trainerAdventureContract.connect(deployer).setAdminWallet(admin.address, false);
        isAdmin = await trainerAdventureContract.adminWallets(admin.address);
        expect(isAdmin).to.be.false;
    });
});

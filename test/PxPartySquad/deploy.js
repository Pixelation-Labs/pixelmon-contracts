const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setAdminWallet } = require("./setAdminWallet");
const { setModeratorWallet } = require("./setModeratorWallet");
const { setCallbackGasLimit } = require("./setCallbackGasLimit");
const { setChainLinkKeyHash } = require("./setChainLinkKeyHash");
const { setChainlinkSubscriptionId } = require("./setChainlinkSubscriptionId");
const { setWeeklyTimeStamp } = require("./setWeeklyTimeStamp");
const { updateWeeklyTimeStamp } = require("./updateWeeklyTimeStamp");
const { setVaultAddress } = require("./setVaultAddress");
const { addTreasure } = require("./addTreasure");
const { addSpecialTreasure } = require("./addSpecialTreasure");
const { setSpecialTreasureWinnerLimit } = require("./setSpecialTreasureWinnerLimit");
const { testSignature } = require("./signatureTest");
const { setWeeklyTreasureDistribution } = require("./setWeeklyTreasureDistribution");
const { setWeeklySponsoredTripDistribution } = require("./setWeeklySponsoredTripDistribution");
const { updateWeeklyWinners } = require("./updateWeeklyWinners");
const { claimTreasure } = require("./claimTreasure");
const { chainLinkMockTest } = require("./chainlinkMockTest");
const { setSignatureContractAddress } = require("./setSignatureContractAddress");
const { testNoContractModifier } = require("./testNoContractModifier");

const contractName = "PxPartySquad";

const addPrizeToVault = async (vault) => {
    /* Deploy more contract in this method to add more prizes to the vault */

    const METADATA_BASE_URI = "https://metadata.url/";
    const collection = Object();

    const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
    const PixelmonTrainerGearSupply = 150;
    const pixelmonTrainerGearContractUtils = await PixelmonTrainerGear.deploy(METADATA_BASE_URI);
    await pixelmonTrainerGearContractUtils.deployed();

    // The contract should be saved to 'collection'
    // It will be used to check whether the prize is
    // transferred successfully to the winner
    collection.trainerGear = pixelmonTrainerGearContractUtils;
    await pixelmonTrainerGearContractUtils.setMinterAddress(vault.address, true);
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 1, PixelmonTrainerGearSupply);

    const PixelmonSponsoredTrips = await ethers.getContractFactory("PixelmonSponsoredTrips");
    const PixelmonSponsoredTripsSupply = 40;
    const PixelmonSponsoredTripsUtils = await PixelmonSponsoredTrips.deploy(PixelmonSponsoredTripsSupply, METADATA_BASE_URI);
    await PixelmonSponsoredTripsUtils.deployed();
    collection.specialTreasure = PixelmonSponsoredTripsUtils;
    await PixelmonSponsoredTripsUtils.setMinterAddress(vault.address, true);
    await PixelmonSponsoredTripsUtils.connect(vault).mint(vault.address, PixelmonSponsoredTripsSupply);

    const PixelmonTrainer = await ethers.getContractFactory(
        "PixelmonTrainer"
    );
    const PixelmonTrainerSupply = 4;
    const PixelmonTrainerUtils = await PixelmonTrainer.deploy(
        "Trainer",
        "TRN",
        METADATA_BASE_URI
    );
    await PixelmonTrainerUtils.deployed();
    collection.trainer = PixelmonTrainerUtils;
    await PixelmonTrainerUtils.whitelistAddress(vault.address, true);
    await PixelmonTrainerUtils.connect(vault).mintRangeOne(vault.address, PixelmonTrainerSupply);

    return collection;
};

const createSignature = async (weekNumber, claimIndex, walletAddress, signer, contract) => {

    const signatureObject = {
        weekNumber: weekNumber,
        claimIndex: claimIndex, // for a particular if a user claim first time then the it will be 0, for second claim it will be 1. For the second week it will start from 0 again
        walletAddress: walletAddress
    };

    // For goerli network it will be 5, for mainnet it will be 1 
    const chainId = 31337;
    const SIGNING_DOMAIN_NAME = "Pixelmon-Party-Squad";
    const SIGNING_DOMAIN_VERSION = "1";
    const types = {
        PartySquadSignature: [
            { name: "weekNumber", type: "uint256" },
            { name: "claimIndex", type: "uint256" },
            { name: "walletAddress", type: "address" }
        ]
    };

    const domain = {
        name: SIGNING_DOMAIN_NAME,
        version: SIGNING_DOMAIN_VERSION,
        verifyingContract: contract.address,
        chainId
    };

    const signature = await signer._signTypedData(domain, types, signatureObject);
    return signature;
};

describe(`${contractName} contract`, () => {
    let contract;
    let testUsers;
    let psChainlinkManager;
    let AttackerSmartContract;

    it("Should deploy contract", async () => {
        testUsers = await ethers.getSigners();
        let signer = testUsers[7];

        const Attacker = await ethers.getContractFactory("TrainerAdventureAttacker");
        AttackerSmartContract = await Attacker.deploy();
        await AttackerSmartContract.deployed();

        const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
        const mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.deployed();

        const _vrfCoordinator = mockVRFCoordinator.address;
        const _subscriptionId = 1;
        const _keyHash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";

        const PsChainlinkManager = await hre.ethers.getContractFactory("PsChainlinkManager");
        psChainlinkManager = await PsChainlinkManager.deploy(signer.address, _vrfCoordinator, _subscriptionId, _keyHash);
        await psChainlinkManager.deployed();

        
        const factory = await ethers.getContractFactory(contractName);
        contract = await factory.deploy(psChainlinkManager.address);
        expect(await contract.deployed()).to.be.ok;
    });

    it("Test contract method", async () => {
        testUsers = await ethers.getSigners();
        const previousBlockNumber = await ethers.provider.getBlockNumber();
        const previousBlock = await ethers.provider.getBlock(previousBlockNumber);
        const blockTimestamp = previousBlock.timestamp;

        await setAdminWallet(contract, testUsers);
        await setModeratorWallet(contract, testUsers);
        await setCallbackGasLimit(psChainlinkManager, testUsers);
        await setChainLinkKeyHash(psChainlinkManager, testUsers);
        await setChainlinkSubscriptionId(psChainlinkManager, testUsers);
        await setWeeklyTimeStamp(contract, testUsers, blockTimestamp);
        await updateWeeklyTimeStamp(contract, testUsers, blockTimestamp);

        const [_, admin] = testUsers;
        await setVaultAddress(contract, testUsers);
        const collection = await addPrizeToVault(admin);
        await collection.trainerGear.setAllowedToTransfer(contract.address, true);

        await addTreasure(contract, testUsers, collection);
        await addSpecialTreasure(contract, testUsers, collection);
        await setSpecialTreasureWinnerLimit(contract, testUsers);
        await setWeeklyTreasureDistribution(contract, testUsers, blockTimestamp);
        await setWeeklySponsoredTripDistribution(contract, testUsers, blockTimestamp);
        await updateWeeklyWinners(contract, testUsers);
        await psChainlinkManager.connect(testUsers[0]).setPartySquadContractAddress(contract.address);
        await chainLinkMockTest(contract, testUsers);
        await claimTreasure(contract, testUsers, collection, blockTimestamp, createSignature, psChainlinkManager);
        await testSignature(contract, testUsers, createSignature, psChainlinkManager);
        await setSignatureContractAddress(contract, testUsers, psChainlinkManager);
        await testNoContractModifier(contract, AttackerSmartContract);
    });
});

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
const { addSponsoredTripTreasure } = require("./addSponsoredTripTreasure");
const { setSponsoredTripWinnerMap } = require("./setSponsoredTripWinnerMap");
const { testSignature } = require("./signatureTest");
const { setWeeklyTreasureDistribution } = require("./setWeeklyTreasureDistribution");
const { setWeeklySponsoredTripDistribution } = require("./setWeeklySponsoredTripDistribution");
const { updateWeeklyWinners } = require("./updateWeeklyWinners");
const { claimTreasure } = require("./claimTreasure");
const { chainLinkMockTest } = require("./chainLinkMockTest");

const contractName = "PxTrainerAdventure";

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
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 2, PixelmonTrainerGearSupply);
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 3, PixelmonTrainerGearSupply);
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 4, PixelmonTrainerGearSupply);
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 5, PixelmonTrainerGearSupply);
    await pixelmonTrainerGearContractUtils.connect(vault).mint(vault.address, 6, PixelmonTrainerGearSupply);

    const PixelmonSponsoredTrips = await ethers.getContractFactory("PixelmonSponsoredTrips");
    const PixelmonSponsoredTripsSupply = 40;
    const PixelmonSponsoredTripsUtils = await PixelmonSponsoredTrips.deploy(PixelmonSponsoredTripsSupply, METADATA_BASE_URI);
    await PixelmonSponsoredTripsUtils.deployed();
    collection.sponsoredTrip = PixelmonSponsoredTripsUtils;
    await PixelmonSponsoredTripsUtils.setMinterAddress(vault.address, true);
    await PixelmonSponsoredTripsUtils.connect(vault).mint(vault.address, PixelmonSponsoredTripsSupply);

    const PixelmonTrainer = await ethers.getContractFactory(
        "PixelmonTrainer"
    );
    const PixelmonTrainerSupply = 50;
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
    const SIGNING_DOMAIN_NAME = "Pixelmon-Trainer-Adventure";
    const SIGNING_DOMAIN_VERSION = "1";
    const types = {
        TrainerAdventureSignature: [
            { name: "weekNumber", type: "uint256" },
            { name: "claimIndex", type: "uint256" },
            { name: "walletAddress", type: "address" },
        ],
    };

    const domain = {
        name: SIGNING_DOMAIN_NAME,
        version: SIGNING_DOMAIN_VERSION,
        verifyingContract: contract.address,
        chainId,
    };

    const signature = await signer._signTypedData(domain, types, signatureObject);
    return signature;
}

describe(`${contractName} contract`, () => {
    let contract;
    let testUsers;
    let pxTrainerAdventureSignature;

    it("Should deploy contract", async () => {
        testUsers = await ethers.getSigners();
        let signer = testUsers[7];

        const PxTrainerAdventureSignature = await hre.ethers.getContractFactory("PxTrainerAdventureSignature");
        pxTrainerAdventureSignature = await PxTrainerAdventureSignature.deploy(signer.address);
        await pxTrainerAdventureSignature.deployed();

        const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
        const mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.deployed();

        const _vrfCoordinator = mockVRFCoordinator.address;
        const _subscriptionId = process.env.SUBSCRIPTION_ID;
        const _keyHash = process.env.KEY_HASH;
        const factory = await ethers.getContractFactory(contractName);
        contract = await factory.deploy(_vrfCoordinator, _subscriptionId, _keyHash, pxTrainerAdventureSignature.address);
        expect(await contract.deployed()).to.be.ok;
    });

    it("Test contract method", async () => {
        testUsers = await ethers.getSigners();
        const previousBlockNumber = await ethers.provider.getBlockNumber();
        const previousBlock = await ethers.provider.getBlock(previousBlockNumber);
        const blockTimestamp = previousBlock.timestamp;

        await setAdminWallet(contract, testUsers);
        await setModeratorWallet(contract, testUsers);
        await setCallbackGasLimit(contract, testUsers);
        await setChainLinkKeyHash(contract, testUsers);
        await setChainlinkSubscriptionId(contract, testUsers);
        await setWeeklyTimeStamp(contract, testUsers, blockTimestamp);
        await updateWeeklyTimeStamp(contract, testUsers, blockTimestamp);

        const [_, admin] = testUsers;
        await setVaultAddress(contract, testUsers);
        const collection = await addPrizeToVault(admin);

        await addTreasure(contract, testUsers, collection);
        await addSponsoredTripTreasure(contract, testUsers, collection);
        await setSponsoredTripWinnerMap(contract, testUsers);
        await setWeeklyTreasureDistribution(contract, testUsers, blockTimestamp);
        await setWeeklySponsoredTripDistribution(contract, testUsers, blockTimestamp);
        await updateWeeklyWinners(contract, testUsers);
        await claimTreasure(contract, testUsers, collection);
        await updateWeeklyWinners(contract, testUsers);
        await testSignature(pxTrainerAdventureSignature, testUsers, createSignature);
        await chainLinkMockTest(contract, testUsers);
    });
});

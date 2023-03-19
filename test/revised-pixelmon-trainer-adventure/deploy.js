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
const { updateWeeklyWinners } = require("./updateWeeklyWinners");

const contractName = "PxTrainerAdventure";

const addPrizeToVault = async (vault) => {
    /* Deploy more contract in this method to add more prizes to the vault */

    const METADATA_BASE_URI = "https://metadata.url/";
    const collection = Object();

    const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
    const PixelmonTrainerGearSupply = 150;
    const pixelmonTrainerGearContractUtils = await PixelmonTrainerGear.deploy(METADATA_BASE_URI);
    await pixelmonTrainerGearContractUtils.deployed();

    // The contract address should be saved to 'collection'
    // It will be used as collection address for the prize in
    // the smart contract
    collection.trainerGear = pixelmonTrainerGearContractUtils.address;
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
    collection.sponsoredTrip = PixelmonSponsoredTripsUtils.address;
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
    collection.trainer = PixelmonTrainerUtils.address;
    await PixelmonTrainerUtils.whitelistAddress(vault.address, true);
    await PixelmonTrainerUtils.connect(vault).mintRangeOne(vault.address, PixelmonTrainerSupply);

    return collection;
};

describe(`${contractName} contract`, () => {
    let contract;
    let testUsers;

    it("Should deploy contract", async () => {
        const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
        const mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.deployed();
        testUsers = await ethers.getSigners();
        let signer = testUsers[7];

        const _vrfCoordinator = mockVRFCoordinator.address;
        const _subscriptionId = process.env.SUBSCRIPTION_ID;
        const _keyHash = process.env.KEY_HASH;
        const factory = await ethers.getContractFactory(contractName);
        contract = await factory.deploy(_vrfCoordinator, _subscriptionId, _keyHash, signer.address);
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
        await updateWeeklyWinners(contract, testUsers);
    })
})

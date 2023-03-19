const { expect } = require("chai");
const { ethers } = require("hardhat");
const {setAdminWallet} = require("./setAdminWallet");
const {setModeratorWallet} = require("./setModeratorWallet");
const {setCallbackGasLimit} = require("./setCallbackGasLimit");
const {setChainLinkKeyHash} = require("./setChainLinkKeyHash");
const {setChainlinkSubscriptionId} = require("./setChainlinkSubscriptionId");
const {setWeeklyTimeStamp} = require("./setWeeklyTimeStamp");
const {updateWeeklyTimeStamp} = require("./updateWeeklyTimeStamp");
const {setVaultAddress} = require("./setVaultAddress");
const {addTreasure} = require("./addTreasure");
const contractName = "PxTrainerAdventure";

describe(`${contractName} contract`, () => {
    let contract;
    let testUsers;

    it("Should deploy contract", async () => {
        const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
        const mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.deployed();

        const _vrfCoordinator = mockVRFCoordinator.address;
        const _subscriptionId = process.env.SUBSCRIPTION_ID;
        const _keyHash = process.env.KEY_HASH;
        const factory = await ethers.getContractFactory(contractName);
        contract = await factory.deploy(_vrfCoordinator, _subscriptionId, _keyHash);
        expect(await contract.deployed()).to.be.ok;
    })

    it("Test contract method", async() => {
        testUsers = await ethers.getSigners();
        const previousBlockNumber = await ethers.provider.getBlockNumber();
        const previousBlock = await ethers.provider.getBlock(previousBlockNumber);
        const blockTimestamp = previousBlock.timestamp

        await setAdminWallet(contract, testUsers);
        await setModeratorWallet(contract, testUsers);
        await setCallbackGasLimit(contract, testUsers);
        await setChainLinkKeyHash(contract, testUsers);
        await setChainlinkSubscriptionId(contract, testUsers);
        await setWeeklyTimeStamp(contract, testUsers, blockTimestamp);
        await updateWeeklyTimeStamp(contract, testUsers, blockTimestamp);
        await setVaultAddress(contract, testUsers);
        await addTreasure(contract, testUsers);
    })
})
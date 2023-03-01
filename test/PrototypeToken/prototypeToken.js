const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployerWallet = accounts[0];
    const anonymousWallet = accounts[9];

    const PrototypeToken = await hre.ethers.getContractFactory("PrototypeToken");
    const prototypeToken = await PrototypeToken.deploy();

    await prototypeToken.deployed();

    return {
        deployerWallet,
        anonymousWallet,
        accounts,
        prototypeToken,
    };
}

let deployer;
let anonymous;
let accountList;
let contract;

beforeEach(async function () {
    const { deployerWallet, anonymousWallet, accounts, prototypeToken } = await deployContract();

    accountList = accounts;
    deployer = deployerWallet;
    anonymous = anonymousWallet;
    contract = prototypeToken;
});

describe("Contract deployment test", function () {
    it("Contract should be successfully deployed", async function () {
        expect(contract.address).not.to.be.null;
    });

    it("Owner will be able to mint token", async function () {
        await contract.mint(deployer.address, 1000);
        let amount = await contract.balanceOf(deployer.address);
        expect(Number(amount)).to.equal(1000);
    });

    it("Owner will be able to mint token more than max supply", async function () {
        await expect(contract.mint(deployer.address, "100000000000000000000000000000000")).to.rejectedWith("Can not mint more than maximum supply");
    });

    it("Owner will be able to pause token", async function () {
        await contract.pause();
        await expect(contract.mint(deployer.address, 1000)).to.rejectedWith("Pausable: paused");
        let amount = await contract.balanceOf(deployer.address);
        expect(Number(amount)).to.equal(0);
    });

    it("Owner will be able to unpause token", async function () {
        await contract.pause();
        await expect(contract.mint(deployer.address, 1000)).to.rejectedWith("Pausable: paused");
        await contract.unpause();
        await contract.mint(deployer.address, 1000);
        let amount = await contract.balanceOf(deployer.address);
        expect(Number(amount)).to.equal(1000);
    });
});

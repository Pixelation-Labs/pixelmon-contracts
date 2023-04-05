const { ethers } = require("hardhat");

const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";

async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const newContractOwner = accounts[5];
    const anonymousWallet = accounts[9];
    const signer = accounts[8];

    const MockFT = await ethers.getContractFactory("MockFT");
    const mockFT = await MockFT.deploy();
    await mockFT.deployed();

    const MockNFT = await ethers.getContractFactory("MockNFT2");
    const mockNFT = await MockNFT.deploy();
    await mockNFT.deployed();

    const PixelmonEvolution = await hre.ethers.getContractFactory("PixelmonEvolution");
    const pixelmonEvolution = await PixelmonEvolution.deploy(mockNFT.address, mockFT.address, signer.address);
    await pixelmonEvolution.deployed();

    return {
        deployer,
        anonymousWallet,
        newContractOwner,
        mockFT,
        mockNFT,
        pixelmonEvolution,
        signer,
    };
}

module.exports = {
    deployContract,
    NOT_CURRENT_OWNER,
};

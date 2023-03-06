const { ethers } = require("hardhat");

const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";
const METADATA_BASE_URI = "https://www.metadata.com/";
const NEW_METADATA_BASE_URI = "https://www.newmetadata.com/";

async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployerWallet = accounts[0];
    const anonymousWallet = accounts[9];
    const newContractOwnerWallet = accounts[8];
    const minterWallet = accounts[7];
    const allowedToTransferWallet = accounts[6];

    const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
    const pixelmonTrainerGearContract = await PixelmonTrainerGear.deploy(METADATA_BASE_URI);

    await pixelmonTrainerGearContract.deployed();

    return {
        minterWallet,
        deployerWallet,
        anonymousWallet,
        newContractOwnerWallet,
        pixelmonTrainerGearContract,
        allowedToTransferWallet
    };
}

module.exports = {
    deployContract,
    METADATA_BASE_URI,
    NOT_CURRENT_OWNER,
    NEW_METADATA_BASE_URI
};
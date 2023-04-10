// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
require("dotenv").config();

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy

    let pixelmonContract = process.env.PIXELMON_CONTRACT;
    let serumContract = process.env.SERUM_CONTRACT;
    let signerWallet = process.env.SIGNER_WALLET;

    const PixelmonEvolution = await hre.ethers.getContractFactory("PixelmonEvolution");
    const pixelmonEvolution = await PixelmonEvolution.deploy(pixelmonContract, serumContract, signerWallet);

    await pixelmonEvolution.deployed();

    console.log("PixelmonEvolution deployed to:", pixelmonEvolution.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

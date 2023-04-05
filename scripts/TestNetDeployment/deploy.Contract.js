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
    let _vrfCoordinator = process.env.VRF_COORDINATOR;
    let _subscriptionId = process.env.SUBSCRIPTION_ID;
    let _keyHash = process.env.KEY_HASH;
    const PixelmonTrainerAdventure = await hre.ethers.getContractFactory("EvolutionSerum");
    const pixelmonTrainerAdventure = await PixelmonTrainerAdventure.deploy("0x70C1605b5a0cCF86571807af565f3eD4F9D00b78", "https://pixelmon.club/api/serum/meta/");
    await pixelmonTrainerAdventure.deployed();
    console.log("Pixelmon deployed to:", pixelmonTrainerAdventure.address);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });





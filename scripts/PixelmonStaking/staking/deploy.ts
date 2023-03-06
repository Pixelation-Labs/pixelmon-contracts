import constructorArgs from "./arguments";

const { ethers } = require("hardhat");

async function deploy() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying from: ", deployer.address);
  console.log("Contract constructor args: ", constructorArgs);

  const pixelmonStakingFactory = await ethers.getContractFactory(
    "PixelmonStaking"
  );
  const pixelmonStaking = await pixelmonStakingFactory.deploy(
    ...constructorArgs
  );

  await pixelmonStaking.deployed();

  console.log("PixelmonStaking deployed to: ", pixelmonStaking.address);
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

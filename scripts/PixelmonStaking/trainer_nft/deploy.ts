import constructorArgs from "./arguments";

const { ethers } = require("hardhat");

async function deploy() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying from: ", deployer.address);
  console.log("Contract constructor args: ", constructorArgs);

  const PixelmonTrainer = await ethers.getContractFactory("PixelmonTrainer");
  const pixelmonTrainer = await PixelmonTrainer.deploy(...constructorArgs);

  await pixelmonTrainer.deployed();

  console.log("PixelmonTrainer deployed to: ", pixelmonTrainer.address);
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

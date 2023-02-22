const { ethers } = require("hardhat");

const constructorArgs: Array<string> = [
  "0x0000000000000000000000000000000000000000", // Pixelmon contract
  "0x0000000000000000000000000000000000000000" // PixelmonTrainer contract
];

export default constructorArgs;

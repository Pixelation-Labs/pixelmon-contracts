var ethers = require('ethers');  
var privateKey = "0x0fd134f4755c4b3545315aacd44c303ae4670d0da00b8f480f35aa85061f9424";
var wallet = new ethers.Wallet(privateKey);
console.log("Address: " + wallet.address);

const createSignature = async (weekNumber, claimIndex, walletAddress, signer, contract) => {

  const signatureObject = {
      weekNumber: weekNumber,
      claimIndex: claimIndex, // for a particular if a user claim first time then the it will be 0, for second claim it will be 1. For the second week it will start from 0 again
      walletAddress: walletAddress
  };

  // For goerli network it will be 5, for mainnet it will be 1 
  const chainId = 5;
  const SIGNING_DOMAIN_NAME = "Pixelmon-Trainer-Adventure";
  const SIGNING_DOMAIN_VERSION = "1";
  const types = {
      TrainerAdventureSignature: [
          { name: "weekNumber", type: "uint256" },
          { name: "claimIndex", type: "uint256" },
          { name: "walletAddress", type: "address" },
      ],
  };

  const domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: contract.address,
      chainId,
  };

  const signature = await signer._signTypedData(domain, types, signatureObject);
  console.log(signature);
}

async function main() {
  
  const PxTrainerAdventureSignature = await hre.ethers.getContractFactory("PxChainlinkManager");
  const pxTrainerAdventureSignature = PxTrainerAdventureSignature.attach('0x6E66d39605F51C988BaDa97d9694d48a88Cc2d54');
  const accounts = await hre.ethers.getSigners();
  const deployer = accounts[0];
  await createSignature(1, 7, "0xbf8B59b334AC1a8C230952a53BEfb85e7E91f2B8", deployer, pxTrainerAdventureSignature);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
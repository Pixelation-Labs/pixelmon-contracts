require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-abi-exporter');
require('dotenv').config();
require('solidity-coverage')

const NETWORK = process.env.NETWORK || 'hardhat';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
//const MNEMONIC = process.env.MNEMONIC || '';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

/*
 * @dev this is for custom gas price for hardhat config. Only use this configuration if we want to provide some custom gas 
 * price during the deployment of the smart contract.
 */

module.exports = {
  solidity: "0.8.16",
  defaultNetwork: NETWORK,
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true, // delete old files before export
    flat: true, // all abi json files directly under path
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/_HAZUDPZGDJViXbRLTl46zPOUzRDzTrC`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/b8Uz5l-fP0sVGjcpTTGqUw87jlPsFkph`,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: 'B5BJDZ526T7SINAJRN3TJ7FPU5KAJQACDS',
      goerli: 'B5BJDZ526T7SINAJRN3TJ7FPU5KAJQACDS'
    }
  }
}
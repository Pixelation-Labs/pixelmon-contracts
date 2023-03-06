const {expect} = require("chai");
const {ethers} = require("hardhat");
const {burn} = require("./burn");
const {mint} = require("./mint");
const {setMinterAddress} = require("./setMinterAddress");
const {setTokenSupply} = require("./setTokenSupply");
const {setBurningStatus} = require("./setBurningStatus");
const {setMintingStatus} = require("./setMintingStatus");
const {uri} = require("./uri");
const {baseURI, contractName, tokenSupply} = require("./constant");

describe(`${contractName} contract`, function () {
  let contract;
  let testUsers;

  it("Should deploy contract", async function () {
    testUsers = await ethers.getSigners();

    const PixelmonSponsoredTrips = await ethers.getContractFactory(contractName);

    contract = await PixelmonSponsoredTrips.deploy(tokenSupply, baseURI);

    await contract.deployed();
    expect(await contract.baseURI()).to.equal(baseURI);
  });

  it("Test contracts method", async function() {
    await uri(contract, testUsers);
    await setMintingStatus(contract, testUsers);
    await setMinterAddress(contract, testUsers);
    await mint(contract, testUsers);
    await setTokenSupply(contract, testUsers);
    await setBurningStatus(contract, testUsers);
    await burn(contract, testUsers);
  })
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { 
  tokenSupply,
  ErrorNotOwner,
  ErrorSupplyLessThanMintedToken } = require("./constant");

const setTokenSupply = async (contract, testUsers) => {
  const [_, otherUser, minterAddress] = testUsers;

  describe("setTokenSupply", function () {
    it("Should owner who changes token supply", async function() {
      const newSupply = 100;
      await expect(contract.connect(otherUser).setTokenSupply(newSupply)).to.be.revertedWith(ErrorNotOwner);
      
      expect(await contract.tokenTotalSupply()).to.equal(tokenSupply);
    });

    it("Should change token supply", async function() {
      const initialSupply = await contract.tokenTotalSupply();
      expect(initialSupply).to.equal(tokenSupply);

      let newSupply = ethers.constants.MaxUint256;
      await contract.setTokenSupply(newSupply);
      expect(await contract.tokenTotalSupply()).to.equal(newSupply);

      let mintAmount = 1
      await expect(contract.connect(minterAddress).mint(minterAddress.address, mintAmount)).to.not.reverted;

      await contract.setTokenSupply(initialSupply+mintAmount);
      expect(await contract.tokenTotalSupply()).to.equal(initialSupply+mintAmount);
    })

    it("Should not change total supply less than minted token", async function() {
      let newSupply = 10;
      await expect(contract.setTokenSupply(newSupply)).to.be.revertedWith(ErrorSupplyLessThanMintedToken);
    });
  })
}

module.exports = {setTokenSupply}

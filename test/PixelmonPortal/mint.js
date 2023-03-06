const { expect } = require("chai");
const { 
  EventMint,
  ErrorNotMinter,
  ErrorMintingIsDisabled,
  ErrorMintMoreThanSupply,
  ErrorInvalidAddress,
  ErrorMintZero,
  tokenId 
} = require("./constant");
const {ethers} = require("hardhat");

const mint = async (contract, testUsers) => {
  const [_,otherUser,minterAddress] = testUsers;
  let minterBalance;
  let mintedTokenAmount;

  describe(`mint`, function () {
    it("Should be minter address who can mint", async function() {
      const mintAmount = 10;
      minterBalance = Number(await contract.balanceOf(minterAddress.address, tokenId));
      mintedTokenAmount = await contract.mintedTokenAmount();
      await expect(contract.mint(minterAddress.address, mintAmount)).to.be.revertedWithCustomError(contract, ErrorNotMinter)
      expect(await contract.mintedTokenAmount()).to.equal(0);
      expect(await contract.balanceOf(minterAddress.address, tokenId)).to.equal(minterBalance);
    })

    it("Should not mint when isMintingAllowed is false", async function() {
      const mintAmount = 10;
      await contract.setMintingStatus(false);
      await expect(contract.connect(minterAddress).mint(minterAddress.address, mintAmount)).to.be.revertedWithCustomError(contract, ErrorMintingIsDisabled);
      expect(await contract.mintedTokenAmount()).to.equal(0);
      await contract.setMintingStatus(true);
    });

    it("Should not mint 0 token", async function() {
      await expect(contract.connect(minterAddress).mint(minterAddress.address, 0)).to.be.revertedWith(ErrorMintZero);
    });

    it("Should not mint 0x0 address", async function() {
      await expect(contract.connect(minterAddress).mint(ethers.constants.AddressZero, 1)).to.be.revertedWithCustomError(contract, ErrorInvalidAddress);
    });

    it("Should emit Mint event", async function() {
      let mintAmount = 1;
      await expect(contract.connect(minterAddress).mint(otherUser.address, mintAmount)).to.emit(contract, EventMint).withArgs(otherUser.address, tokenId, mintAmount);
      mintedTokenAmount = Number(mintedTokenAmount + mintAmount);
    });

    it("Should mint 60 tokens", async function() {
      expect(Number(await contract.balanceOf(otherUser.address, tokenId))).to.equal(1);
      expect(Number(await contract.balanceOf(minterAddress.address, tokenId))).to.equal(0);

      let firstMintAmount = 19;
      await contract.connect(minterAddress).mint(otherUser.address, firstMintAmount);
      mintedTokenAmount = Number(mintedTokenAmount + firstMintAmount);
      expect(await contract.mintedTokenAmount()).to.equal(mintedTokenAmount);

      let secondMintAmount = 40;
      await contract.connect(minterAddress).mint(minterAddress.address, secondMintAmount);
      mintedTokenAmount+=secondMintAmount;
      expect(await contract.mintedTokenAmount()).to.equal(mintedTokenAmount);

      expect(Number(await contract.balanceOf(otherUser.address, tokenId))).to.equal(firstMintAmount+1); // Already minted 1 previously for testing Mint event
      expect(Number(await contract.balanceOf(minterAddress.address, tokenId))).to.equal(secondMintAmount);
    });

    it("Should not mint more than total supply", async function() {
      await expect(contract.connect(minterAddress).mint(minterAddress.address, 1)).to.be.revertedWith(ErrorMintMoreThanSupply);
    });
  });
}


module.exports = {mint}

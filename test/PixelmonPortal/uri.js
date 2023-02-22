const { expect } = require("chai");
const { ErrorNotOwner,ErrorInvalidAddress } = require("./constant");
const {ethers} = require("hardhat");

const uri = async (contract, testUsers) => {
  const [_,otherUser] = testUsers
  const newURI = "https://new-url/";

  describe(`setURI`, function () {
    it("Should owner who set URI", async function() {
      await expect(contract.connect(otherUser).setURI(newURI)).to.be.revertedWith(ErrorNotOwner);
    })
    it("Should set URI", async function() {
      expect(await contract.baseURI()).to.not.equal(newURI);
      await contract.setURI(newURI);
      expect(await contract.baseURI()).to.equal(newURI);
    })
  })

  describe(`uri`, function () {
    it("Should consistently return the same token metadata URI", async function() {
      const tokenURI = `${newURI}1`;
      let token = 12;
      expect(await contract.uri(token)).to.equal(tokenURI);
      token = 0;
      expect(await contract.uri(token)).to.equal(tokenURI);
    })

    it("Should be callable by public", async function() {
      const tokenURI = `${newURI}1`;
      const token = 12;
      expect(await contract.connect(otherUser).uri(token)).to.equal(tokenURI);
    })

    it("Should return empty string if no baseURI available", async function() {
      const tokenURI = "";
      const token = 12;
      await contract.setURI("");
      expect(await contract.uri(token)).to.equal(tokenURI);
    })
  })
}

module.exports = {uri}

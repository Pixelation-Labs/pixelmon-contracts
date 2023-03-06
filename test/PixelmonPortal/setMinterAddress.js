const { expect } = require("chai");
const { ErrorNotOwner,ErrorInvalidAddress } = require("./constant");
const {ethers} = require("hardhat");

const setMinterAddress = async (contract, testUsers) => {
  const [_,otherUser,minterAddress] = testUsers

  describe("setMinterAddress", function () {
    it("Should owner who set minter address", async function() {

      await expect(contract.connect(otherUser).setMinterAddress(minterAddress.address, true))
        .to.be.revertedWith(ErrorNotOwner);
      expect(await contract.minterList(minterAddress.address)).to.not.ok;
    })

    it("Should not set mint address to 0x0", async function() {
      await expect(contract.setMinterAddress(ethers.constants.AddressZero, true)).to.be.revertedWithCustomError(contract, ErrorInvalidAddress);
    });

    it("Should set minter address permission", async function() {
      await contract.setMinterAddress(minterAddress.address, true);
      expect(await contract.minterList(minterAddress.address)).to.be.ok;
      await contract.setMinterAddress(minterAddress.address, false);
      expect(await contract.minterList(minterAddress.address)).to.not.ok;
      await contract.setMinterAddress(minterAddress.address, true);
      expect(await contract.minterList(minterAddress.address)).to.be.ok;
    })
  })
}


module.exports = {setMinterAddress}

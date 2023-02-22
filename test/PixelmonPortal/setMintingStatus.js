const { expect } = require("chai");
const { ErrorNotOwner } = require("./constant");

const setMintingStatus = async (contract, testUsers) => {
  const [_,otherUser] = testUsers;

  describe("setMintingStatus", function () {
    it("Should owner who set minting status", async function() {
      const initialCondition = await contract.isMintingAllowed();
      await expect(contract.connect(otherUser).setMintingStatus(!initialCondition)).to.be.revertedWith(ErrorNotOwner);
    });

    it("Should set minting status", async function() {
      await contract.setMintingStatus(true)
      expect(await contract.isMintingAllowed()).to.be.ok;
      await contract.setMintingStatus(false)
      expect(await contract.isMintingAllowed()).to.not.ok;
      await contract.setMintingStatus(true)
      expect(await contract.isMintingAllowed()).to.be.ok;
    });
  })
}

module.exports = {setMintingStatus}


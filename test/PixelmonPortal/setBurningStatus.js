const { expect } = require("chai");
const { ErrorNotOwner } = require("./constant");

const setBurningStatus = async (contract, testUsers) => {
  const [_,otherUser] = testUsers;

  describe("setBurningStatus", function () {
    it("Should owner who set burning status", async function() {
      await expect(contract.connect(otherUser).setBurningStatus(true)).to.be.revertedWith(ErrorNotOwner);
    });

    it("Should set burning status", async function() {
      await contract.setBurningStatus(true);
      expect(await contract.isBurningAllowed()).to.ok;
      await contract.setBurningStatus(false);
      expect(await contract.isBurningAllowed()).to.not.ok;
      await contract.setBurningStatus(true);
      expect(await contract.isBurningAllowed()).to.ok;
    });
  });
}

module.exports = {setBurningStatus};

const { expect } = require("chai");
const { ErrorBurnZero,ErrorBurnExceedBalance,ErrorBurningIsDisabled,tokenId } = require("./constant");

const burn = async (contract, testUsers) => {
  const [_,otherUser,minterAddress] = testUsers;

  describe("burn", function () {
    it("Should not burn when isBurningAllowed is false", async function() {
      await contract.setBurningStatus(false);
      await expect(contract.connect(minterAddress).burn(1)).to.be.revertedWithCustomError(contract, ErrorBurningIsDisabled);
      await contract.setBurningStatus(true);
    });

    it("Should not burn more than owned token", async function() {
      await expect(contract.burn(1)).to.be.revertedWith(ErrorBurnExceedBalance);
    });

    it("Should burn token", async function() {
      const initialBalance = Number(await contract.balanceOf(minterAddress.address, tokenId));
      const burnAmount = 10;
      await contract.connect(minterAddress).burn(burnAmount);
      expect(Number(await contract.balanceOf(minterAddress.address,tokenId))).to.equal(initialBalance - burnAmount);
    });
  });
}

module.exports = {burn}

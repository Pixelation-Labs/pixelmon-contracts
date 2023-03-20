const { expect } = require("chai");
const path = require("node:path");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {
    NotModerator,
    InvalidUpdationPeriod,
    WinnerUpdationDuration
} = require("./constant");

const chainLinkMockTest = async (contract, testUsers) => {

    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    const [owner, admin, moderator] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Chainlink mock should generate random number", async () => {
            const currentWeekNumber = 1;
            await expect(contract.generateChainLinkRandomNumbers(currentWeekNumber)).to.be.revertedWithCustomError(contract,NotModerator);
            await contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber);
            await expect(contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber + 10)).to.be.revertedWithCustomError(contract,InvalidUpdationPeriod);
            time.increase(WinnerUpdationDuration);
            await expect(contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber)).to.be.revertedWithCustomError(contract,InvalidUpdationPeriod);
        });
    });
};

module.exports = { chainLinkMockTest };
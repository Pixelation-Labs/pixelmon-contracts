const path = require("node:path");
const {time} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {
    InvalidLength,
    InvalidWeekNumber,
    InvalidUpdationPeriod,
    NotModerator,
    PrizeUpdationDuration,
    WeeklyWinnersSet
} = require("./constant");

const updateWeeklyWinners = async(contract, testUsers) => {
    const moderator = testUsers[2];
    const winners = testUsers.slice(6,9).map(winner => winner.address);
    const prizeAmount = Array(winners.length).fill(2);
    describe(path.basename(__filename, ".js"), () => {
        it("Should not update winner before its period", async() => {
            let weekNumber = 1;
            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.be.revertedWithCustomError(contract, InvalidUpdationPeriod);

            time.increase(PrizeUpdationDuration);
            weekNumber = 2;
            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.be.revertedWithCustomError(contract, InvalidUpdationPeriod);
        });

        it("Should update winner of the week", async() => {
            const weekNumber = 1;

            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                [2,2,3]
            )).to.be.revertedWith("Invalid Treasure Amount");

            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.emit(contract, WeeklyWinnersSet);

            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.emit(contract, WeeklyWinnersSet);

            const weekData = await contract.getWeekInfo(weekNumber);
            for(let winner of weekData.specialTreasureWinners) {
                // Should return false since the selected winner
                // is the one who has not claimed/owned Sponsored Trip
               expect(await contract.specialTreasureWinnersLimit(winner)).to.equal(0);
            }
        })

        it("Should input valid week number", async() => {
            const weekNumber = 98;
            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.be.revertedWithCustomError(contract, InvalidUpdationPeriod);
        })

        it("Should input winner and prize amount array with the same length", async() => {
            const weekNumber = 1;
            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                [],
                prizeAmount
            )).to.be.revertedWithCustomError(contract, InvalidLength);

            await expect(contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winners,
                []
            )).to.be.revertedWithCustomError(contract, InvalidLength);
        })

        it("Only moderator can update the winner of the week", async() => {
            const weekNumber = 1;
            await expect(contract.updateWeeklyWinners(
                weekNumber,
                winners,
                prizeAmount
            )).to.be.revertedWithCustomError(contract, NotModerator);
        })
    });
}

module.exports = {updateWeeklyWinners};

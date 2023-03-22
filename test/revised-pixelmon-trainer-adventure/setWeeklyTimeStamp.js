const path = require("node:path");
const { expect } = require("chai");
const {
    InvalidDuration,
    NotAdmin,
    PrizeUpdationDuration,
    WeeklyDuration,
    WinnerUpdationDuration
} = require("./constant");

const setWeeklyTimeStamp = async (contract, testUsers, blockTimestamp) => {
    const [_, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        const weekNumber = 2;
        it("Should set weekly timestamp", async () => {
            expect(await contract.totalWeek()).to.be.equal(0)
            await contract.connect(admin).setWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration);
            expect(await contract.totalWeek()).to.be.equal(2);
            let [startTimestamp, ticketDrawPeriod, claimPrizePeriod, endTimestamp] = await contract.weekInfos(1);
            expect(startTimestamp).to.be.equal(blockTimestamp);
            expect(ticketDrawPeriod).to.be.equal(blockTimestamp+PrizeUpdationDuration);
            expect(claimPrizePeriod).to.be.equal(blockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(endTimestamp).to.be.equal(blockTimestamp+WeeklyDuration-1);

            [startTimestamp, ticketDrawPeriod, claimPrizePeriod, endTimestamp] = await contract.weekInfos(2);
            let newBlockTimestamp = blockTimestamp+WeeklyDuration;
            expect(startTimestamp).to.be.equal(newBlockTimestamp);
            expect(ticketDrawPeriod).to.be.equal(newBlockTimestamp+PrizeUpdationDuration);
            expect(claimPrizePeriod).to.be.equal(newBlockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(endTimestamp).to.be.equal(newBlockTimestamp+WeeklyDuration-1);
        });

        it("Each week should have different timestamps", async () => {
            await new Promise((resolve) => setTimeout(resolve,1000))
            // Set timestamp for Week 3 since the totalWeek will be incremented when this method is called
            await expect(contract.connect(admin).setWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration)).to.be.reverted;
        })

        it("Only admin can set weekly timestamp", async () => {
            await expect(contract.setWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration)).to.be.revertedWithCustomError(contract, NotAdmin);
        });

        it("Weekly duration can't be less than total of prize distribution and winner update period", async () => {
            await expect(contract.connect(admin).setWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                0)).to.be.revertedWithCustomError(contract, InvalidDuration);
        })
    });
};

module.exports = {setWeeklyTimeStamp};
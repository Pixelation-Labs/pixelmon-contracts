const path = require("node:path");
const {expect} = require("chai");
const {
    InvalidDuration,
    InvalidTimeStamp,
    InvalidWeekNumber,
    PrizeUpdationDuration,
    WeeklyDuration,
    WinnerUpdationDuration
} = require("./constant");

const updateWeeklyTimeStamp = async(contract, testUsers, blockTimestamp) => {
    describe(path.basename(__filename, ".js"), () => {
        const [_, admin] = testUsers;

        it("Should update weekly timestamp", async() => {
            const weekNumber = 1;
            const newBlockTimestamp = blockTimestamp - 100;
            await contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                newBlockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration);
            let [startTimestamp, ticketDrawPeriod, claimPrizePeriod, endTimestamp] = await contract.getWeekInfo(weekNumber);
            expect(startTimestamp).to.be.equal(newBlockTimestamp);
            expect(ticketDrawPeriod).to.be.equal(newBlockTimestamp+PrizeUpdationDuration);
            expect(claimPrizePeriod).to.be.equal(newBlockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(endTimestamp).to.be.equal(newBlockTimestamp+WeeklyDuration-1);

            await contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration);
            [startTimestamp, ticketDrawPeriod, claimPrizePeriod, endTimestamp] = await contract.getWeekInfo(weekNumber);
            expect(startTimestamp).to.be.equal(blockTimestamp);
            expect(ticketDrawPeriod).to.be.equal(blockTimestamp+PrizeUpdationDuration);
            expect(claimPrizePeriod).to.be.equal(blockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(endTimestamp).to.be.equal(blockTimestamp+WeeklyDuration-1);
        })

        it("Should not update non-exist week", async() => {
            const weekNumber = 100;
            const newBlockTimestamp = Date.now();

            await expect(contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                newBlockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration)).to.be.revertedWithCustomError(contract, InvalidWeekNumber);
        });

        it("Weekly duration can't be less than total of prize distribution and winner update period", async () => {
            const weekNumber = 1;
            await expect(contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                0)).to.be.revertedWithCustomError(contract, InvalidDuration);
        })

        it("Should not set start timestamp earlier than previous week", async() => {
            const weekNumber = 2;
            await expect(contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration)).to.be.revertedWithCustomError(contract, InvalidTimeStamp);
        })

        it("Should not set end timestamp later than next week", async() => {
            const weekNumber = 1;
            await expect(contract.connect(admin).updateWeeklyTimeStamp(
                weekNumber,
                blockTimestamp,
                PrizeUpdationDuration,
                WinnerUpdationDuration,
                WeeklyDuration * 2)).to.be.revertedWithCustomError(contract, InvalidTimeStamp);
        })
    })
}

module.exports = {updateWeeklyTimeStamp}
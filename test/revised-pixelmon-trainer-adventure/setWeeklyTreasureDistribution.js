const path = require("node:path");
const { expect } = require("chai");
const {
    InvalidLength,
    InvalidUpdationPeriod,
    NotAdmin,
    PrizeUpdationDuration,
    WeeklyDuration,
    WinnerUpdationDuration
} = require("./constant");

const setWeeklyTreasureDistribution = async(contract, testUsers, blockTimestamp) => {
    describe(path.basename(__filename, ".js"), () => {
        const [_,admin] = testUsers;

        it("Should set weekly distribution", async() => {
            let weekNumber = 1;
            const treasureIndex = [1,2];
            const count = [1,3]

            await contract.connect(admin).setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count
            )

            const weekData = await contract.weekInfos(weekNumber);
            expect(Number(weekData.startTimeStamp)).to.be.equal(blockTimestamp);
            expect(Number(weekData.ticketDrawTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration);
            expect(Number(weekData.claimStartTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(Number(weekData.endTimeStamp)).to.be.equal(blockTimestamp+WeeklyDuration-1);
            expect(Number(weekData.remainingSupply)).to.be.equal(count.reduce((accumulator,currentValue) => accumulator+currentValue));
            expect(Number(weekData.treasureCount)).to.be.equal(treasureIndex.length);
            expect(Number(weekData.sponsoredTripsCount)).to.be.equal(0);
            expect(Number(weekData.availabletripsCount)).to.be.equal(0);
        });

        it("Should not set weekly prize before its period", async() => {
            let weekNumber = 2;
            const treasureIndex = [1,2];
            const count = [2,2]

            await expect(contract.connect(admin).setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count
            )).to.be.revertedWithCustomError(contract, InvalidUpdationPeriod);
        });

        it("Should give input treasureIndex and count array with the same length", async() => {
            let weekNumber = 1;
            let treasureIndex = [1,2];
            let count = [1];
            await expect(contract.connect(admin).setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count
            )).to.be.revertedWithCustomError(contract, InvalidLength);

            treasureIndex = [2];
            count = [1,2];
            await expect(contract.connect(admin).setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count
            )).to.be.revertedWithCustomError(contract, InvalidLength);
        })

        it("Only admin can set weekly treasure distribution", async() => {
            const weekNumber = 1;
            const treasureIndex = [1,2];
            const count = [1,2];
            await expect(contract.setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count
            )).to.be.revertedWithCustomError(contract, NotAdmin);

        })
    });
}

module.exports = {setWeeklyTreasureDistribution}
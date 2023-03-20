const path = require("node:path");
const { expect } = require("chai");
const {
    InvalidUpdationPeriod,
    NotAdmin,
    PrizeUpdationDuration,
    WeeklyDuration,
    WinnerUpdationDuration
} = require("./constant");

const setWeeklySponsoredTripDistribution = async(contract, testUsers, blockTimestamp) => {
    describe(path.basename(__filename, ".js"), () => {
        const [_,admin] = testUsers;

        it("Should set weekly sponsored trip distribution", async() => {
            let weekNumber = 1;
            const count = 2

            await contract.connect(admin).setWeeklySponsoredTripDistribution(
                weekNumber,
                count
            )

            const weekData = await contract.weekInfos(weekNumber);
            expect(Number(weekData.startTimeStamp)).to.be.equal(blockTimestamp);
            expect(Number(weekData.ticketDrawTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration);
            expect(Number(weekData.claimStartTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(Number(weekData.endTimeStamp)).to.be.equal(blockTimestamp+WeeklyDuration-1);
            expect(Number(weekData.remainingSupply)).to.be.equal(3);
            expect(Number(weekData.treasureCount)).to.be.equal(2);
            expect(Number(weekData.sponsoredTripsCount)).to.be.equal(count);
            expect(Number(weekData.availabletripsCount)).to.be.equal(count);
        });

        it("Should not set weekly sponsored trip prize before its period", async() => {
            let weekNumber = 2;
            const count = 2;

            await expect(contract.connect(admin).setWeeklySponsoredTripDistribution(
                weekNumber,
                count
            )).to.be.revertedWithCustomError(contract, InvalidUpdationPeriod);
        });

        it("Only admin can set weekly sponsored trip distribution", async() => {
            const weekNumber = 1;
            const count = 2;
            await expect(contract.setWeeklySponsoredTripDistribution(
                weekNumber,
                count
            )).to.be.revertedWithCustomError(contract, NotAdmin);

        })
    });
}

module.exports = {setWeeklySponsoredTripDistribution}
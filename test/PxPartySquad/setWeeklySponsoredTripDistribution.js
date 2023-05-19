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

            // await contract.connect(admin).setWeeklySponsoredTripDistribution(
            //     weekNumber,
            //     count
            // )

            const weekData = await contract.weekInfos(weekNumber);
            expect(Number(weekData.startTimeStamp)).to.be.equal(blockTimestamp);
            expect(Number(weekData.ticketDrawTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration);
            expect(Number(weekData.claimStartTimeStamp)).to.be.equal(blockTimestamp+PrizeUpdationDuration+WinnerUpdationDuration);
            expect(Number(weekData.endTimeStamp)).to.be.equal(blockTimestamp+WeeklyDuration-1);
            expect(Number(weekData.remainingSupply)).to.be.equal(4);
            expect(Number(weekData.treasureCount)).to.be.equal(2);
            expect(Number(weekData.specialTreasureCount)).to.be.equal(count);
            expect(Number(weekData.availableSpecialTreasureCount)).to.be.equal(count);
        });
    });
}

module.exports = {setWeeklySponsoredTripDistribution}

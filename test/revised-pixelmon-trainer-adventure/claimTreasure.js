const path = require("node:path");
const {time} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {
    InvalidClaimingPeriod,
    InvalidLength,
    InvalidWeekNumber,
    InvalidUpdationPeriod,
    ERC1155NotOwnerOrApproved,
    NotModerator,
    PrizeUpdationDuration,
    WinnerUpdationDuration,
    WeeklyWinnersSet
} = require("./constant");

const claimTreasure = async(contract, testUsers, collection) => {
    const [_,admin] = testUsers;
    const winners = testUsers.slice(6,9);
    const weekNumber = 1;
    describe(path.basename(__filename, ".js"), () => {
        it("Should not claim treasure before its period", async() => {
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);

            time.increase(PrizeUpdationDuration+WinnerUpdationDuration);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber+1))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);
        })

        it("Should get approval from vault address before transfer prize", async() => {
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, false);
            }
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber))
                .to.be.revertedWith(ERC1155NotOwnerOrApproved);
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, true);
            }
        })

        it("Should claim Sponsored Trip prize", async() => {
            for(let winner of winners.slice(0,2)) {
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
                await contract.connect(winner).claimTreasure(weekNumber);
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(1);
            }
        })

        it("Address in sponsoredTripWinners map should not get Sponsored Trip prize", async() => {
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, true);
            }

            const winner = winners[2];
            expect(await contract.sponsoredTripWinners(winner.address)).to.be.ok;
            expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
            await contract.connect(winner).claimTreasure(weekNumber);
            expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
        })
    })
}

module.exports = {claimTreasure};
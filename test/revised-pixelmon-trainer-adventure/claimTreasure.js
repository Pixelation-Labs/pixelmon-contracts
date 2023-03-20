const path = require("node:path");
const {time} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {
    AlreadyClaimed,
    InvalidClaimingPeriod,
    ERC1155NotOwnerOrApproved,
    PrizeUpdationDuration,
    TreasureTransferred,
    WinnerUpdationDuration,
} = require("./constant");

const claimTreasure = async(contract, testUsers, collection, createSignature, pxTrainerAdventureSignature) => {
    const [_,admin] = testUsers;
    const winners = testUsers.slice(6,9);
    const signer = testUsers[7];
    const weekNumber = 1;
    describe(path.basename(__filename, ".js"), () => {
        it("Should get approval from vault address before transfer prize", async() => {
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, false);
            }
            let signature = await createSignature(weekNumber, 0, winners[1].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber, signature))
                .to.be.revertedWith(ERC1155NotOwnerOrApproved);
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, true);
            }
        })

        it("Should claim Sponsored Trip prize", async() => {
            let count = 0;
            let claimIndex = 2;
            for(let winner of winners.slice(0,2)) {
                let signature = await createSignature(weekNumber, count, winner.address, signer, pxTrainerAdventureSignature);
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
                await expect(contract.connect(winner).claimTreasure(weekNumber, signature))
                    .to.emit(contract, TreasureTransferred).withArgs(
                        weekNumber,
                        claimIndex,
                        winner.address,
                        collection.sponsoredTrip.address,
                        1,
                        await contract.ERC_1155_TYPE(),
                        0
                    );
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(1);
                claimIndex+=2;
            }
        })

        it("Address in sponsoredTripWinners map should not get Sponsored Trip prize", async() => {
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, true);
            }

            const winner = winners[2];
            let signature = await createSignature(weekNumber, 0, winner.address, signer, pxTrainerAdventureSignature);
            expect(await contract.sponsoredTripWinners(winner.address)).to.be.ok;
            expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.emit(contract, TreasureTransferred);
            signature = await createSignature(weekNumber, 1, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.emit(contract, TreasureTransferred);
            expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
            expect(Number(await collection.trainerGear.balanceOf(winner.address, 1))).to.be.equal(1);
            expect(Number(await collection.trainer.balanceOf(winner.address))).to.be.equal(1);
            expect(Number(await contract.getWeeklyClaimedCount(weekNumber, winner.address))).to.be.equal(2);
        })

        it("Should not claim more than its limit", async () => {
            const winner = winners[2];
            let signature = await createSignature(weekNumber, 2, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.revertedWithCustomError(contract, AlreadyClaimed);
        })

        it("Should throw error when prize weekly supply is not sufficient", async () => {
            let winner = winners[0];
            let signature = await createSignature(weekNumber, 1, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.emit(contract, TreasureTransferred);

            winner = winners[1];
            signature = await createSignature(weekNumber, 1, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.revertedWithPanic(0x12);
        })

        it("Should not claim treasure before its period", async() => {
            time.increase(WinnerUpdationDuration+PrizeUpdationDuration);
            let signature = await createSignature(weekNumber, 0, winners[1].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber, signature))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);

            await expect(contract.connect(winners[1]).claimTreasure(weekNumber+1, signature))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);
        })

    })
}

module.exports = {claimTreasure};
const path = require("node:path");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {
    AlreadyClaimed,
    InsufficientToken,
    InvalidClaimingPeriod,
    InvalidSignature,
    ERC1155NotOwnerOrApproved,
    TreasureTransferred,
    WeeklyDuration,
    PrizeUpdationDuration,
    NotEnoughWinnersForSponsoredTrip,
    WinnerUpdationDuration,
    NotAWinner
} = require("./constant");

const claimTreasure = async (contract, testUsers, collection, blockTimestamp, createSignature, pxTrainerAdventureSignature) => {
    const [_, admin, moderator] = testUsers;
    let winners = testUsers.slice(6, 9);
    const signer = testUsers[7];
    const weekNumber = 1;
    describe(path.basename(__filename, ".js"), () => {
        it("Should get approval from vault address before transfer prize", async () => {
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, false);
            }
            let signature = await createSignature(weekNumber, 0, winners[1].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber, signature))
                .to.be.revertedWith(ERC1155NotOwnerOrApproved);
            for (let token of Object.values(collection)) {
                token.connect(admin).setApprovalForAll(contract.address, true);
            }
        });

        it("Should claim Sponsored Trip prize", async () => {
            let count = 0;
            let claimIndex = 2;
            for (let winner of winners.slice(0, 2)) {
                let signature = await createSignature(weekNumber, count, winner.address, signer, pxTrainerAdventureSignature);
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(0);
                await expect(contract.connect(winner).claimTreasure(weekNumber, signature))
                    .to.emit(contract, TreasureTransferred).withArgs(
                        weekNumber,
                        winner.address,
                        collection.sponsoredTrip.address,
                        1,
                        await contract.ERC_1155_TYPE()
                    );
                expect(Number(await collection.sponsoredTrip.balanceOf(winner.address, 1))).to.be.equal(1);
                claimIndex += 2;
            }
        });

        it("Address in sponsoredTripWinners map should not get Sponsored Trip prize", async () => {
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
        });

        it("Should not claim more than its limit", async () => {
            const winner = winners[2];
            let signature = await createSignature(weekNumber, 2, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.revertedWithCustomError(contract, AlreadyClaimed);
        });

        it("Should throw error when prize weekly supply is not sufficient", async () => {
            let winner = winners[0];
            let signature = await createSignature(weekNumber, 1, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.emit(contract, TreasureTransferred);

            winner = winners[1];
            signature = await createSignature(weekNumber, 1, winner.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winner).claimTreasure(weekNumber, signature)).to.emit(contract, TreasureTransferred);
        });

        it("Should not claim treasure before its period", async () => {
            let signature = await createSignature(weekNumber, 0, winners[1].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber + 1, signature))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);
            time.setNextBlockTimestamp(blockTimestamp + WeeklyDuration);
            await expect(contract.connect(winners[1]).claimTreasure(weekNumber, signature))
                .to.be.revertedWithCustomError(contract, InvalidClaimingPeriod);
        });

        it("Should claim on second week", async () => {
            let weekNumber = 2;
            const treasureIndex = [1, 2];
            const prizeAmount = [2,2,3];
            const count = [0, 6];

            await contract.connect(admin).setWeeklyTreasureDistribution(
                weekNumber,
                treasureIndex,
                count,
                2
            );


            time.increase(PrizeUpdationDuration);

            // await expect(contract.connect(moderator).updateWeeklyWinners(
            //     weekNumber,
            //     winners.map((wallet) => wallet.address),
            //     prizeAmount
            // )).to.be.revertedWithCustomError(contract, NotEnoughWinnersForSponsoredTrip);

            winners = testUsers.slice(4, 7);
            const winnerAddress = winners.map((wallet) => wallet.address);
            await contract.connect(moderator).updateWeeklyWinners(
                weekNumber,
                winnerAddress,
                prizeAmount
            );

            time.increase(WinnerUpdationDuration);

            let signature = await createSignature(weekNumber, 0, admin.address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(admin).claimTreasure(weekNumber, signature)).to.be.revertedWithCustomError(contract, NotAWinner);

            for (let winner of winners.slice(0, 2)) {
                signature = await createSignature(weekNumber, 0, winner.address, signer, pxTrainerAdventureSignature);
                await contract.connect(winner).claimTreasure(weekNumber, signature);
            }

            expect(Number(await collection.trainer.balanceOf(admin.address))).to.be.equal(2);
            signature = await createSignature(weekNumber, 0, winners[2].address, signer, pxTrainerAdventureSignature);
            await contract.connect(winners[2]).claimTreasure(weekNumber, signature);

            expect(Number(await collection.trainer.balanceOf(admin.address))).to.be.equal(1);
            signature = await createSignature(weekNumber, 1, winners[2].address, signer, pxTrainerAdventureSignature);
            await contract.connect(winners[2]).claimTreasure(weekNumber, signature);

            signature = await createSignature(weekNumber, 1, winners[2].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[2]).claimTreasure(weekNumber, signature)).to.be.revertedWithCustomError(contract, InvalidSignature);

            expect(Number(await collection.trainer.balanceOf(admin.address))).to.be.equal(0);
            signature = await createSignature(weekNumber, 2, winners[2].address, signer, pxTrainerAdventureSignature);
            await expect(contract.connect(winners[2]).claimTreasure(weekNumber, signature)).to.be.revertedWithCustomError(contract, InsufficientToken);
        });

    });
};

module.exports = { claimTreasure };
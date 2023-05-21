const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setSpecialTreasureWinnerLimit = async (contract, testUsers) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {

        it("Only admin can update maxSpecialTreasureLimit", async () => {
            await expect(contract.connect(owner).updateMaxSpecialTreasureLimit(5))
                .to.be.revertedWithCustomError(contract, "NotAdmin");

            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);
            await contract.connect(admin).updateMaxSpecialTreasureLimit(5);
            let treasureLimit = await contract.maxSpecialTreasureLimit(); 
            expect(treasureLimit).to.equal(5);
        });
        it("setSpecialTreasureWinnerLimit as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let winnerList = [
                testUsers[9].address,
                testUsers[8].address,
            ];

            let winnerLimit = [
                2,
                1
            ]

            await contract.connect(admin).setSpecialTreasureWinnerLimit(winnerList, winnerLimit);

            winnerList.forEach(async (winnerAddress, index) => {
                let isPreviousWinner = await contract.specialTreasureWinnersLimit(winnerAddress);
                expect(isPreviousWinner).to.equal(winnerLimit[index]);
            });

            winnerLimit = [
                1,
                2
            ]

            await contract.connect(admin).setSpecialTreasureWinnerLimit(winnerList, winnerLimit);

            winnerList.forEach(async (winnerAddress, index) => {
                let isPreviousWinner = await contract.specialTreasureWinnersLimit(winnerAddress);
                expect(isPreviousWinner).to.equal(winnerLimit[index]);
            });

            winnerLimit = [
                1
            ];

            await expect(contract.connect(admin).setSpecialTreasureWinnerLimit(winnerList, winnerLimit))
                .to.be.revertedWithCustomError(contract, "InvalidLength");
        });

        it("Only admin can setSpecialTreasureWinnerLimit", async () => {

            let winnerList = [
                testUsers[9].address,
                testUsers[8].address,
            ];

            let winnerLimit = [
                1,
                2
            ]

            await expect(contract.connect(owner).setSpecialTreasureWinnerLimit(winnerList, winnerLimit))
                .to.be.revertedWithCustomError(contract, "NotAdmin");
        });

    });
}

module.exports = {setSpecialTreasureWinnerLimit}
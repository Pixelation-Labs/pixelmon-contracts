const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setSponsoredTripWinnerMap = async (contract, testUsers) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("setSponsoredTripWinnerMap as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let winnerList = [
                testUsers[9].address,
                testUsers[8].address,
            ];

            let winnerFlag = [
                true,
                true
            ]

            await contract.connect(admin).setSponsoredTripWinnerMap(winnerList, winnerFlag);

            winnerList.forEach(async (winnerAddress, index) => {
                let isPreviousWinner = await contract.sponsoredTripWinners(winnerAddress);
                expect(isPreviousWinner).to.equal(winnerFlag[index]);
            });

            winnerFlag = [
                false,
                true
            ]

            await contract.connect(admin).setSponsoredTripWinnerMap(winnerList, winnerFlag);

            winnerList.forEach(async (winnerAddress, index) => {
                let isPreviousWinner = await contract.sponsoredTripWinners(winnerAddress);
                expect(isPreviousWinner).to.equal(winnerFlag[index]);
            });

            winnerFlag = [
                false
            ];

            await expect(contract.connect(admin).setSponsoredTripWinnerMap(winnerList, winnerFlag))
                .to.be.revertedWithCustomError(contract, "InvalidLength");
        });

        it("Only admin can setSponsoredTripWinnerMap", async () => {

            let winnerList = [
                testUsers[9].address,
                testUsers[8].address,
            ];

            let winnerFlag = [
                true,
                true
            ]

            await expect(contract.connect(owner).setSponsoredTripWinnerMap(winnerList, winnerFlag))
                .to.be.revertedWithCustomError(contract, "NotAdmin");
        });
    });
}

module.exports = {setSponsoredTripWinnerMap}
const { expect } = require("chai");
const path = require("node:path");

const chainLinkMockTest = async (contract, testUsers) => {

    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    const [owner, admin, moderator] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Chainlink mock should generate random number", async () => {

            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            await contract.setModeratorWallet(moderator.address, true);

            var currentDateTime = new Date();
            var resultInSeconds=currentDateTime.getTime() / 1000;
            let currentTimeStamp = Math.floor(resultInSeconds);

            await contract.connect(admin).updateWeeklyTimeStamp(
                1,
                currentTimeStamp,
                10,
                10,
                30
            );
            let currentWeekNumber = Number(await contract.totalWeek());

            await expect(contract.generateChainLinkRandomNumbers(currentWeekNumber)).to.be.revertedWithCustomError(contract, 'NotModerator');
            await expect(contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber)).to.be.revertedWithCustomError(contract, 'InvalidUpdationPeriod');
            
            await sleep(11 * 1000);
            await contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber);
            await expect(contract.connect(moderator).generateChainLinkRandomNumbers(currentWeekNumber + 10)).to.be.revertedWithCustomError(contract, 'InvalidWeekNumber');
            // let isAdmin = await contract.adminWallets(admin.address);
            // expect(isAdmin).to.equal(true);

            // let treasure = {
            //     collectionAddress: collection.sponsoredTrip.address,
            //     tokenId: 1,
            //     tokenIds: [],
            //     claimedToken: 0,
            //     contractType: await contract.ERC_1155_TYPE(),
            //     treasureType: 1
            // };


            // await contract.connect(admin).addSponsoredTripTreasure(treasure);

            // let treasureData = await contract.sponsoredTrip();
            // expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            // expect(Number(treasureData.tokenId)).to.equal(treasure.tokenId);
            // expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
            // expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
            // expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);

            // // // Note: negative test
            // treasure = {
            //     collectionAddress: owner.address,
            //     tokenId: 1,
            //     tokenIds: [],
            //     claimedToken: 1,
            //     contractType: 1,
            //     treasureType: 1
            // };

            // await expect(contract.connect(admin).addSponsoredTripTreasure(treasure))
            //     .to.be.revertedWithCustomError(contract, "InvalidInput");

            // treasure = {
            //     collectionAddress: owner.address,
            //     tokenId: 1,
            //     tokenIds: [],
            //     claimedToken: 0,
            //     contractType: 0,
            //     treasureType: 1
            // };

            // await expect(contract.connect(admin).addSponsoredTripTreasure(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            // treasure = {
            //     collectionAddress: owner.address,
            //     tokenId: 1,
            //     tokenIds: [],
            //     claimedToken: 0,
            //     contractType: 2,
            //     treasureType: 1
            // };
            // await expect(contract.connect(admin).addSponsoredTripTreasure(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            // treasure = {
            //     collectionAddress: owner.address,
            //     tokenId: 1,
            //     tokenIds: [1, 2],
            //     claimedToken: 0,
            //     contractType: 1,
            //     treasureType: 1
            // };

            // await expect(contract.connect(admin).addSponsoredTripTreasure(treasure))
            //     .to.be.revertedWithCustomError(contract, "InvalidInput");

        });
    });
};

module.exports = { chainLinkMockTest };
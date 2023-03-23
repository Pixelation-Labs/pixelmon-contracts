const { expect } = require("chai");
const path = require("node:path");

const addTreasure = async (contract, testUsers, collection) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Add Treasure as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let totalTreasure = await contract.totalTreasureCount();
            expect(Number(totalTreasure)).to.equal(0);
            const tokenId = 1;
            let treasure = {
                collectionAddress: collection.trainerGear.address,
                tokenId: tokenId,
                tokenIds: [],
                claimedToken: 0,
                contractType: await contract.ERC_1155_TYPE(),
                treasureType: 1
            };
            await contract.connect(admin).addTreasures(treasure);
            totalTreasure = await contract.totalTreasureCount();
            expect(Number(totalTreasure)).to.equal(1);
            let treasureData = await contract.treasures(Number(totalTreasure));
            expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            expect(Number(treasureData.tokenId)).to.equal(treasure.tokenId);
            expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
            expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
            expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);

            treasure = {
                collectionAddress: collection.trainer.address,
                tokenId: 0,
                tokenIds: Array.from({ length: 4 }, (_, i) => i + 1),
                claimedToken: 0,
                contractType: await contract.ERC_721_TYPE(),
                treasureType: 2
            };
            await contract.connect(admin).addTreasures(treasure);
            totalTreasure = await contract.totalTreasureCount();
            expect(Number(totalTreasure)).to.equal(2);
            treasureData = await contract.treasures(Number(totalTreasure));
            expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            expect(treasureData.tokenId).to.equal(treasure.tokenId);
            expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
            expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
            expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);

            // Note: negative test
            // treasure = {
            //     collectionAddress: owner.address,
            //     tokenId: 1,
            //     tokenIds: [],
            //     claimedToken: 1,
            //     contractType: 1,
            //     treasureType: 1
            // };

            // await expect(contract.connect(admin).addTreasures(treasure))
            //     .to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 0,
                treasureType: 1
            };

            await expect(contract.connect(admin).addTreasures(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 3,
                treasureType: 1
            };
            await expect(contract.connect(admin).addTreasures(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [1, 2],
                claimedToken: 0,
                contractType: 1,
                treasureType: 1
            };

            await expect(contract.connect(admin).addTreasures(treasure))
                .to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 2,
                treasureType: 1
            };

            await expect(contract.connect(admin).addTreasures(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 2,
                tokenIds: [1, 2, 3],
                claimedToken: 0,
                contractType: 2,
                treasureType: 1
            };
            await contract.connect(admin).addTreasures(treasure);

            totalTreasure = await contract.totalTreasureCount();
            await contract.connect(admin).updateTreasure(totalTreasure, treasure);
            let updatedTreasure = await contract.getTreasureById(totalTreasure);
            expect(Number(updatedTreasure.tokenId)).to.equal(treasure.tokenId);

            let allTreasure = await contract.getTreasures();
            expect(allTreasure.length).to.equal(Number(totalTreasure));
        });

        it("Only admin can add treasure", async () => {

            let treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 1,
                treasureType: 1
            };

            await expect(contract.connect(owner).addTreasures(treasure))
                .to.be.revertedWithCustomError(contract, "NotAdmin");
        });
    });
};

module.exports = { addTreasure };
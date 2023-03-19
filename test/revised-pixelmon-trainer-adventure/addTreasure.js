const { expect } = require("chai");

const addTreasure = async (contract, testUsers, collection) => {
    const [owner, admin] = testUsers;
    describe("Add Treasure", () => {
        it("Add Treasure as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let totalTreasure = await contract.totalTreasures();
            expect(Number(totalTreasure)).to.equal(0);
            for (let tokenId = 1; tokenId <= 6; tokenId++) {
                let treasure = {
                    collectionAddress: collection.trainerGear,
                    tokenId: tokenId,
                    tokenIds: [],
                    claimedToken: 0,
                    contractType: await contract.ERC_1155_TYPE(),
                    treasureType: 1
                };
                await contract.connect(admin).addTreasures(treasure);
                totalTreasure = await contract.totalTreasures();
                expect(Number(totalTreasure)).to.equal(tokenId);
                let treasureData = await contract.treasures(Number(totalTreasure));
                expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
                expect(Number(treasureData.tokenId)).to.equal(treasure.tokenId);
                expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
                expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
                expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);
            }

            let treasure = {
                collectionAddress: collection.trainer,
                tokenId: 0,
                tokenIds: Array.from({ length: 50 }, (_, i) => i + 1),
                claimedToken: 0,
                contractType: await contract.ERC_721_TYPE(),
                treasureType: 2
            };
            await contract.connect(admin).addTreasures(treasure);
            totalTreasure = await contract.totalTreasures();
            expect(Number(totalTreasure)).to.equal(7);
            let treasureData = await contract.treasures(Number(totalTreasure));
            expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            expect(treasureData.tokenId).to.equal(treasure.tokenId);
            expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
            expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
            expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);

            // Note: negative test
            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 1,
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
                tokenId: 1,
                tokenIds: [1, 2, 3],
                claimedToken: 0,
                contractType: 2,
                treasureType: 1
            };
            await contract.connect(admin).addTreasures(treasure);
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
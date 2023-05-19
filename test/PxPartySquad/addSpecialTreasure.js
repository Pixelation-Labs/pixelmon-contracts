const { expect } = require("chai");
const path = require("node:path");

const addSpecialTreasure = async (contract, testUsers, collection) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("addSpecialTreasure as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let treasure = {
                collectionAddress: collection.specialTreasure.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: await contract.ERC_1155_TYPE(),
                treasureType: 1
            };


            await contract.connect(admin).addSpecialTreasure(treasure);

            let treasureData = await contract.specialTreasure();
            expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            expect(Number(treasureData.tokenId)).to.equal(treasure.tokenId);
            expect(Number(treasureData.claimedToken)).to.equal(treasure.claimedToken);
            expect(Number(treasureData.contractType)).to.equal(treasure.contractType);
            expect(Number(treasureData.treasureType)).to.equal(treasure.treasureType);

            // // Note: negative test
            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 1,
                contractType: 1,
                treasureType: 1
            };

            // await expect(contract.connect(admin).addSpecialTreasure(treasure))
            //     .to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 0,
                treasureType: 1
            };

            await expect(contract.connect(admin).addSpecialTreasure(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 2,
                treasureType: 1
            };
            await expect(contract.connect(admin).addSpecialTreasure(treasure)).to.be.revertedWithCustomError(contract, "InvalidInput");

            treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [1, 2],
                claimedToken: 0,
                contractType: 1,
                treasureType: 1
            };

            await expect(contract.connect(admin).addSpecialTreasure(treasure))
                .to.be.revertedWithCustomError(contract, "InvalidInput");

        });

        it("Only admin can addSpecialTreasure", async () => {

            let treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 1,
                treasureType: 1
            };

            await expect(contract.connect(owner).addSpecialTreasure(treasure))
                .to.be.revertedWithCustomError(contract, "NotAdmin");
        });
    });
};

module.exports = { addSpecialTreasure };
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const addTreasure = async (contract, testUsers) => {
    const [owner, admin] = testUsers;
    describe("Add Treasure", () => {
        it("Add Treasure as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            let isAdmin = await contract.adminWallets(admin.address);
            expect(isAdmin).to.equal(true);

            let treasure = {
                collectionAddress: owner.address,
                tokenId: 1,
                tokenIds: [],
                claimedToken: 0,
                contractType: 1,
                treasureType: 1
            };

            let totalTreasure = await contract.totalTreasures();
            expect(Number(totalTreasure)).to.equal(0);
            await contract.connect(admin).addTreasures(treasure);
            totalTreasure = await contract.totalTreasures();
            expect(Number(totalTreasure)).to.equal(1);
            
            let treasureData = await contract.treasures(Number(totalTreasure));
            expect(treasureData.collectionAddress).to.equal(treasure.collectionAddress);
            expect(Number(treasureData.tokenId)).to.equal(treasure.tokenId);
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
                tokenIds: [1,2],
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
    
                await expect(contract.connect(admin).addTreasures(treasure))
                    .to.be.revertedWithCustomError(contract, "InvalidInput");


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
        })
    })
}

module.exports = {addTreasure}
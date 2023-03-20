const path = require("node:path");
const { expect } = require("chai");
const { ErrorNotOwner } = require("./constant");

const setAdminWallet = async (contract, testUsers) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Set address as Admin", async () => {
            await contract.setAdminWallet(admin.address, true);
            expect(await contract.adminWallets(admin.address)).to.be.ok;
            await contract.setAdminWallet(admin.address, false);
            expect(await contract.adminWallets(admin.address)).to.not.ok;
            await contract.setAdminWallet(admin.address, true);
            expect(await contract.adminWallets(admin.address)).to.be.ok;
        });

        it("Only owner can set address as admin", async () => {
            await expect(contract.connect(admin).setAdminWallet(owner.address, true))
                .to.be.revertedWith(ErrorNotOwner);
        });
    });
};

module.exports = { setAdminWallet };
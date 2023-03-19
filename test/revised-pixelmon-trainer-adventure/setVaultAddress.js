const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setVaultAddress = async (contract, testUsers) => {
    const [owner, admin] = testUsers;
    describe("setVaultAddress", () => {
        it("Contract owner will be able to set vault address", async () => {
            await contract.setVaultWalletAddress(admin.address);
            expect(await contract.setVaultWalletAddress(admin.address)).to.be.ok;
            
            let vaultAddress = await contract.vaultWalletAddress();
            expect(vaultAddress).to.equal(admin.address);
        })

        it("Only owner can set vault address", async () => {
            await expect(contract.connect(admin).setVaultWalletAddress(admin.address))
                .to.be.revertedWith(ErrorNotOwner);
        })
    })
}

module.exports = {setVaultAddress}
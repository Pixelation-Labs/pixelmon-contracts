const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const testSignature = async (contract, testUsers, createSignature) => {
    const [owner, admin] = testUsers;
    describe("signatureTest", () => {
        it("Set address as Admin", async () => {
            let user = testUsers[5];
            let signer = testUsers[7];

            let weekNumber = 1;
            let claimIndex = 0;
            let walletAddress = user.address;


            let signature = await createSignature(weekNumber, claimIndex, walletAddress, signer, contract);
            // console.log(signature);
            let signerAddress = await contract.recoverSignerFromSignature(weekNumber, claimIndex, walletAddress, signature);
            expect(signer.address).to.equal(signerAddress);
            // await contract.setAdminWallet(admin.address, true);
            // expect(await contract.adminWallets(admin.address)).to.be.ok;
            // await contract.setAdminWallet(admin.address, false);
            // expect(await contract.adminWallets(admin.address)).to.not.ok;
            // await contract.setAdminWallet(admin.address, true);
            // expect(await contract.adminWallets(admin.address)).to.be.ok;
        })

        // it("Only owner can set address as admin", async () => {
        //     await expect(contract.connect(admin).setAdminWallet(owner.address, true))
        //         .to.be.revertedWith(ErrorNotOwner);
        // })
    });
}

module.exports = {testSignature}
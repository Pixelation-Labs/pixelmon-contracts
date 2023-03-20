const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const testSignature = async (contract, testUsers, createSignature) => {
    const [owner, admin] = testUsers;
    
    describe("signatureTest", () => {
        it("Signature should be valid", async () => {

            let user = testUsers[5];
            let signer = testUsers[7];

            let weekNumber = 1;
            let claimIndex = 0;
            let walletAddress = user.address;

            let signature = await createSignature(weekNumber, claimIndex, walletAddress, signer, contract);
            let isValid = await contract.recoverSignerFromSignature(weekNumber, claimIndex, walletAddress, signature);
            expect(isValid).to.equal(true);

            isValid = await contract.recoverSignerFromSignature(2, claimIndex, walletAddress, signature);
            expect(isValid).to.equal(false);
        });

        it("Only owner can change signer waller", async () => {
            await expect(contract.connect(admin).setSignerAddress(owner.address))
                .to.be.revertedWith(ErrorNotOwner);
            await contract.connect(owner).setSignerAddress(owner.address);
        });
    });
}

module.exports = {testSignature}
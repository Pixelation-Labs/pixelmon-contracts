const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setSignatureContractAddress = async (contract, testUsers, pxTrainerAdventureSignature) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Set signature contract address", async () => {
            await contract.setSignatureContractAddress(contract.address);
            expect(await contract.SIGNATURE_CONTRACT()).to.be.equal(contract.address);
            await contract.setSignatureContractAddress(pxTrainerAdventureSignature.address);
            expect(await contract.SIGNATURE_CONTRACT()).to.be.equal(pxTrainerAdventureSignature.address);
        });

        it("Only owner can set signature contract address", async () => {
            await expect(contract.connect(admin).setSignatureContractAddress(contract.address))
                .to.be.revertedWith(ErrorNotOwner);
        });
    });
}

module.exports = {setSignatureContractAddress}

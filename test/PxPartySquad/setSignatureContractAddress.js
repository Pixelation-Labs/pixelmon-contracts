const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setSignatureContractAddress = async (contract, testUsers, pxTrainerAdventureSignature) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Set setPsChainlinkManagerContractAddress", async () => {
            await contract.setPsChainlinkManagerContractAddress(contract.address);
            expect(await contract.psChainlinkManagerContract()).to.be.equal(contract.address);
            await contract.setPsChainlinkManagerContractAddress(pxTrainerAdventureSignature.address);
            expect(await contract.psChainlinkManagerContract()).to.be.equal(pxTrainerAdventureSignature.address);
        });

        it("Only owner can setPsChainlinkManagerContractAddress", async () => {
            await expect(contract.connect(admin).setPsChainlinkManagerContractAddress(contract.address))
                .to.be.revertedWith(ErrorNotOwner);
        });
    });
}

module.exports = {setSignatureContractAddress}

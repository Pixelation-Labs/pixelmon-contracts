const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setSignatureContractAddress = async (contract, testUsers, pxTrainerAdventureSignature) => {
    const [owner, admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Set setpxChainlinkManagerContractAddress", async () => {
            await contract.setpxChainlinkManagerContractAddress(contract.address);
            expect(await contract.pxChainlinkManagerContract()).to.be.equal(contract.address);
            await contract.setpxChainlinkManagerContractAddress(pxTrainerAdventureSignature.address);
            expect(await contract.pxChainlinkManagerContract()).to.be.equal(pxTrainerAdventureSignature.address);
        });

        it("Only owner can setpxChainlinkManagerContractAddress", async () => {
            await expect(contract.connect(admin).setpxChainlinkManagerContractAddress(contract.address))
                .to.be.revertedWith(ErrorNotOwner);
        });
    });
}

module.exports = {setSignatureContractAddress}

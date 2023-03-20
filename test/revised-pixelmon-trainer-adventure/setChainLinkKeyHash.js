const path = require("node:path");
const {ethers} = require("hardhat");
const {expect} = require("chai");
const {NotAdmin} = require("./constant")

const setChainLinkKeyHash = async(contract, testUsers) => {
    const [_,admin] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        const newHash = ethers.constants.HashZero;
        it("Should set Chainlink key hash", async () => {
            const initialHash = await contract.keyHash();
            await contract.connect(admin).setChainLinkKeyHash(newHash);
            expect(await contract.keyHash()).to.equal(newHash);
            await contract.connect(admin).setChainLinkKeyHash(initialHash);
            expect(await contract.keyHash()).to.equal(initialHash);
        })

        it("Only admin can set Chainlink key hash", async () => {
            await expect(contract.setChainLinkKeyHash(newHash))
                .to.be.revertedWithCustomError(contract, NotAdmin)
        })
    })
}

module.exports = {setChainLinkKeyHash}

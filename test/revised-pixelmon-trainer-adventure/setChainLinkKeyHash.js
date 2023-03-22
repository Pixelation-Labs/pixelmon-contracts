const path = require("node:path");
const {ethers} = require("hardhat");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setChainLinkKeyHash = async(contract, testUsers) => {
    const [owner, user1] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        const newHash = ethers.constants.HashZero;
        it("Should set Chainlink key hash", async () => {
            const initialHash = await contract.keyHash();
            await contract.connect(owner).setChainLinkKeyHash(newHash);
            expect(await contract.keyHash()).to.equal(newHash);
            await contract.connect(owner).setChainLinkKeyHash(initialHash);
            expect(await contract.keyHash()).to.equal(initialHash);
        })

        it("Only owner wallet can set Chainlink key hash", async () => {
            await expect(contract.connect(user1).setChainLinkKeyHash(newHash))
                .to.be.revertedWith(ErrorNotOwner)
        })
    })
}

module.exports = {setChainLinkKeyHash}

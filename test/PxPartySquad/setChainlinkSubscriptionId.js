const path = require("node:path");
const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setChainlinkSubscriptionId = async(contract, testUsers) => {
    const [owner, user1] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Should set chainlink subscription id", async () => {
            const newLimit = 10000;
            const initialId = await contract.chainLinkSubscriptionId();
            await contract.connect(owner).setChainlinkSubscriptionId(newLimit);
            expect(await contract.chainLinkSubscriptionId()).to.equal(newLimit);
            await contract.connect(owner).setChainlinkSubscriptionId(initialId);
            expect(await contract.chainLinkSubscriptionId()).to.equal(initialId);
        })

        it("Only admin can set Chainlink subscription ID", async () => {
            await expect(contract.connect(user1).setChainlinkSubscriptionId(10000))
                .to.be.revertedWith(ErrorNotOwner)
        })
    })
}

module.exports = {setChainlinkSubscriptionId}

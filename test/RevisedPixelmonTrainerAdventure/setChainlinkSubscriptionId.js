const {expect} = require("chai");
const {NotAdmin} = require("./constant")

const setChainlinkSubscriptionId = async(contract, testUsers) => {
    const [_,admin] = testUsers;
    describe("setChainlinkSubscriptionId", () => {
        it("Should set callback gas limit", async () => {
            const newLimit = 10000;
            const initialId = await contract.chainLinkSubscriptionId();
            await contract.connect(admin).setChainlinkSubscriptionId(newLimit);
            expect(await contract.chainLinkSubscriptionId()).to.equal(newLimit);
            await contract.connect(admin).setChainlinkSubscriptionId(initialId);
            expect(await contract.chainLinkSubscriptionId()).to.equal(initialId);
        })

        it("Only admin can set Chainlink subscription ID", async () => {
            await expect(contract.setChainlinkSubscriptionId(10000))
                .to.be.revertedWithCustomError(contract, NotAdmin)
        })
    })
}

module.exports = {setChainlinkSubscriptionId}

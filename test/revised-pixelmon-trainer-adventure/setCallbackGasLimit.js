const path = require("node:path");
const {expect} = require("chai");
const {CallbackGasLimit, ErrorNotOwner} = require("./constant")

const setCallbackGasLimit = async(contract, testUsers) => {
    const [owner, user1] = testUsers;
    describe(path.basename(__filename, ".js"), () => {
        it("Should set callback gas limit", async () => {
            const newLimit = 10000;
            expect(await contract.callbackGasLimit()).to.equal(CallbackGasLimit);
            await contract.connect(owner).setCallbackGasLimit(newLimit);
            expect(await contract.callbackGasLimit()).to.equal(newLimit);
            await contract.connect(owner).setCallbackGasLimit(CallbackGasLimit);
            expect(await contract.callbackGasLimit()).to.equal(CallbackGasLimit);
        })

        it("Only owner can set callback gas limit", async () => {
            await expect(contract.connect(user1).setCallbackGasLimit(10000))
                .to.be.revertedWith(ErrorNotOwner)
        });

        it("Other wallet will not be able to call generate chainlink random number method", async () => {
            await expect(contract.generateChainLinkRandomNumbers(1))
                .to.be.revertedWithCustomError(contract, "NotAllowedToCall");
        });
    })
}

module.exports = {setCallbackGasLimit}
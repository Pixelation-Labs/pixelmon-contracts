const {expect} = require("chai");
const {CallbackGasLimit, NotAdmin} = require("./constant")

const setCallbackGasLimit = async(contract, testUsers) => {
    const [_,admin] = testUsers;
    describe("setCallbackGasLimit", () => {
        it("Should set callback gas limit", async () => {
            const newLimit = 10000;
            expect(await contract.callbackGasLimit()).to.equal(CallbackGasLimit);
            await contract.connect(admin).setCallbackGasLimit(newLimit);
            expect(await contract.callbackGasLimit()).to.equal(newLimit);
            await contract.connect(admin).setCallbackGasLimit(CallbackGasLimit);
            expect(await contract.callbackGasLimit()).to.equal(CallbackGasLimit);
        })

        it("Only admin can set callback gas limit", async () => {
            await expect(contract.setCallbackGasLimit(10000))
                .to.be.revertedWithCustomError(contract, NotAdmin)
        })
    })
}

module.exports = {setCallbackGasLimit}
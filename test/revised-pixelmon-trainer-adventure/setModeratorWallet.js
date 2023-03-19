const {expect} = require("chai");
const {ErrorNotOwner} = require("./constant")

const setModeratorWallet = async (contract, testUsers) => {
    const [owner, _, moderator] = testUsers;
    describe("setModeratorWallet", () => {
        it("Set address as Moderator", async () => {
            await contract.setModeratorWallet(moderator.address, true);
            expect(await contract.moderatorWallets(moderator.address)).to.be.ok;
            await contract.setModeratorWallet(moderator.address, false);
            expect(await contract.moderatorWallets(moderator.address)).to.not.ok;
            await contract.setModeratorWallet(moderator.address, true);
            expect(await contract.moderatorWallets(moderator.address)).to.be.ok;
        })

        it("Only owner can set address as moderator", async () => {
            await expect(contract.connect(moderator).setModeratorWallet(owner.address, true))
                .to.be.revertedWith(ErrorNotOwner);
        })
    })
}

module.exports = {setModeratorWallet}

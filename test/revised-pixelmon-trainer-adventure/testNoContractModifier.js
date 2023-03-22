const path = require("node:path");
const {expect} = require("chai");
const { ethers } = require("hardhat");

const testNoContractModifier = async(contract, AttackerSmartContract) => {
    describe(path.basename(__filename, ".js"), () => {
        it("Should not able to claim treasure using contract", async() => {
            await expect(AttackerSmartContract.attack(contract.address)).to.be.revertedWith("tx.origin != msg.sender");
        })
    })
}

module.exports = {testNoContractModifier};
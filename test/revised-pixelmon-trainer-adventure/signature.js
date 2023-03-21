const { expect } = require("chai");
const { ethers } = require("hardhat");
const {ErrorNotOwner} = require("./constant");

describe("Signature test", function () {

    const createSignature = async (weekNumber, claimIndex, walletAddress, signer, contract) => {

        const signatureObject = {
            weekNumber: weekNumber,
            claimIndex: claimIndex, // for a particular if a user claim first time then the it will be 0, for second claim it will be 1. For the second week it will start from 0 again
            walletAddress: walletAddress
        };
    
        // For goerli network it will be 5, for mainnet it will be 1 
        const chainId = 31337;
        const SIGNING_DOMAIN_NAME = "Pixelmon-Trainer-Adventure";
        const SIGNING_DOMAIN_VERSION = "1";
        const types = {
            TrainerAdventureSignature: [
                { name: "weekNumber", type: "uint256" },
                { name: "claimIndex", type: "uint256" },
                { name: "walletAddress", type: "address" }
            ]
        };
    
        const domain = {
            name: SIGNING_DOMAIN_NAME,
            version: SIGNING_DOMAIN_VERSION,
            verifyingContract: contract.address,
            chainId
        };
    
        const signature = await signer._signTypedData(domain, types, signatureObject);
        return signature;
    };

    it("Contract should be successfully deployed", async function () {
        let testUsers = await ethers.getSigners();
        let signer = testUsers[7];
        let owner = testUsers[0];
        const PxTrainerAdventureSignature = await hre.ethers.getContractFactory("PxTrainerAdventureSignature");
        let pxTrainerAdventureSignature = await PxTrainerAdventureSignature.deploy(signer.address);
        await pxTrainerAdventureSignature.deployed();

        let user = testUsers[5];

            let weekNumber = 1;
            let claimIndex = 0;
            let walletAddress = user.address;

            let signature = await createSignature(weekNumber, claimIndex, walletAddress, signer, pxTrainerAdventureSignature);
            let isValid = await pxTrainerAdventureSignature.recoverSignerFromSignature(weekNumber, claimIndex, walletAddress, signature);
            expect(isValid).to.equal(true);

            isValid = await pxTrainerAdventureSignature.recoverSignerFromSignature(2, claimIndex, walletAddress, signature);
            expect(isValid).to.equal(false);

        await expect(pxTrainerAdventureSignature.connect(signer).setSignerAddress(owner.address))
            .to.be.revertedWith(ErrorNotOwner);
        await pxTrainerAdventureSignature.connect(owner).setSignerAddress(owner.address);

    });
});

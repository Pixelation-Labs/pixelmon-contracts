const { expect } = require("chai");
const { ethers } = require("hardhat");

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

        await expect(pxTrainerAdventureSignature.connect(admin).setSignerAddress(owner.address))
            .to.be.revertedWith(ErrorNotOwner);
        await pxTrainerAdventureSignature.connect(owner).setSignerAddress(owner.address);

    });

//         const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
//         let errorReason = "";
//         try {
//             await PixelmonTrainerGear.deploy();
//         } catch (error) {
//             errorReason = error.reason;
//         } finally {
//             expect(errorReason).to.equal("missing argument:  in Contract constructor");
//         }
//     });

//     it("Contract should should not deploy with invalid parameter", async function () {
//         const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
//         let errorReason = "";
//         try {
//             await PixelmonTrainerGear.deploy(1, 5);
//         } catch (error) {
//             errorReason = error.reason;
//         } finally {
//             expect(errorReason).to.equal("too many arguments:  in Contract constructor");
//         }
//     });

//     it("Deployer should be the initial contract owner", async function () {
//         const ownerAddress = await contract.owner();
//         expect(ownerAddress).to.equal(deployer.address);
//     });
// });

// describe("Base URI functionality", function () {
//     it("Base URI should be set initially", async function () {
//         const baseURI = await contract.baseURI();
//         expect(baseURI).to.equal(METADATA_BASE_URI);
//     });

//     it("Only Owner will be able to set base URI", async function () {
//         await expect(contract.connect(anonymous).setURI(NEW_METADATA_BASE_URI)).to.be.revertedWith(NOT_CURRENT_OWNER);
//         await contract.connect(deployer).setURI(NEW_METADATA_BASE_URI);

//         const baseURI = await contract.baseURI();
//         expect(baseURI).to.equal(NEW_METADATA_BASE_URI);
//     });
// });

// describe("Token Info functionality", function () {
//     it("There should be 24 total token initially", async function () {
//         const totalToken = await contract.totalToken();
//         expect(Number(totalToken)).to.equal(12);
//     });

//     it("Initial token supply should be 150", async function () {
//         for (let index = 1; index <= 12; index++) {
//             let tokenId = index;
//             let tokenInfo = await contract.getTokenInfo(tokenId);
//             expect(Number(tokenInfo.tokenId)).to.equal(index);
//             expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(0);
//             expect(Number(tokenInfo.maximumTokenSupply)).to.equal(200);
//         }
//     });

//     it("getTokenInfo should provide error for invalid tokenId", async function () {
//         await expect(contract.getTokenInfo(1000)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
//     });
// });

// describe("Add Token Info functionality", function () {
//     it("Only Owner will be able to addTokenInfo", async function () {
//         let maxSupply = await contract.maximumTokenSupply();
//         expect(Number(maxSupply)).to.be.equal(2400);
//         await expect(contract.connect(anonymous).addTokenInfo("New token", 10)).to.be.revertedWith(NOT_CURRENT_OWNER);

//         await contract.connect(deployer).addTokenInfo("New token", 10);

//         const totalToken = await contract.totalToken();
//         expect(Number(totalToken)).to.equal(13);

//         let tokenInfo = await contract.getTokenInfo(13);
//         expect(Number(tokenInfo.tokenId)).to.equal(13);
//         expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(0);
//         expect(Number(tokenInfo.maximumTokenSupply)).to.equal(10);

//         maxSupply = await contract.maximumTokenSupply();
//         expect(Number(maxSupply)).to.be.equal(2410);
//     });
// });

// describe("Set Minter Address functionality", function () {
//     it("Only Owner will be able to setMinterAddress", async function () {
//         await expect(contract.connect(anonymous).setMinterAddress(minter.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//     });

//     it("Owner will be able to setMinterAddress to both true and false status", async function () {
//         let minterStatus = await contract.minterList(minter.address);
//         expect(minterStatus).to.be.false;

//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         minterStatus = await contract.minterList(minter.address);
//         expect(minterStatus).to.be.true;

//         await contract.connect(deployer).setMinterAddress(minter.address, false);
//         minterStatus = await contract.minterList(minter.address);
//         expect(minterStatus).to.be.false;
//     });

//     it("Owner will be able to set zero address as minter address", async function () {
//         await expect(contract.setMinterAddress("0x0000000000000000000000000000000000000000", true)).to.be.revertedWithCustomError(
//             contract,
//             "InvalidAddress"
//         );
//     });
// });

// describe("Set Minting Status functionality", function () {
//     it("Only Owner will be able to setMintingStatus", async function () {
//         await expect(contract.connect(anonymous).setMintingStatus(false)).to.be.revertedWith(NOT_CURRENT_OWNER);
//         await contract.connect(deployer).setMintingStatus(false);
//     });

//     it("Owner will be able to setMinterAddress to both true and false status", async function () {
//         let isMintingActive = await contract.isMintingActive();
//         expect(isMintingActive).to.be.true;

//         await contract.connect(deployer).setMintingStatus(false);
//         isMintingActive = await contract.isMintingActive();
//         expect(isMintingActive).to.be.false;

//         await contract.connect(deployer).setMintingStatus(true);
//         isMintingActive = await contract.isMintingActive();
//         expect(isMintingActive).to.be.true;
//     });
// });

// describe("Mint functionality", function () {
//     it("Only Minter will be able to mint token", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(deployer).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await expect(contract.connect(anonymous).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await contract.connect(minter).mint(anonymous.address, 4, 10);
//     });

//     it("Minter will be able to mint token for valid address", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mint(anonymous.address, 4, 10);

//         await expect(contract.connect(minter).mint("0x0000000000000000000000000000000000000000", 4, 10)).to.be.revertedWithCustomError(
//             contract,
//             "InvalidAddress"
//         );
//     });

//     it("Minter will be able to mint token for when minting is active", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mint(anonymous.address, 4, 10);

//         await contract.connect(deployer).setMintingStatus(false);
//         await expect(contract.connect(minter).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "MintingNotActive");

//         await contract.connect(deployer).setMintingStatus(true);
//         await contract.connect(minter).mint(anonymous.address, 4, 10);
//     });

//     it("Minter will be able to mint token valid token ID", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mint(anonymous.address, 4, 10);

//         await expect(contract.connect(minter).mint(anonymous.address, 0, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");

//         await expect(contract.connect(minter).mint(anonymous.address, 100, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
//     });

//     it("Minter will be able to mint token when minting is active", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mint(anonymous.address, 4, 10);

//         await expect(contract.connect(minter).mint(anonymous.address, 0, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");

//         await expect(contract.connect(minter).mint(anonymous.address, 100, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
//     });

//     it("Minter will be able to mint token valid amount", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(minter).mint(anonymous.address, 4, 0)).to.be.revertedWithCustomError(contract, "ValueCanNotBeZero");

//         await expect(contract.connect(minter).mint(anonymous.address, 4, 500)).to.be.revertedWithCustomError(
//             contract,
//             "MintAmountForTokenTypeExceeded"
//         );

//         await contract.connect(minter).mint(anonymous.address, 4, 200);

//         let tokenInfo = await contract.getTokenInfo(4);
//         expect(Number(tokenInfo.tokenId)).to.equal(4);
//         expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(200);
//         expect(Number(tokenInfo.maximumTokenSupply)).to.equal(200);
//     });
// });

// describe("updateTokenSupply functionality", function () {
//     it("Only Owner will be able to updateTokenSupply", async function () {
//         await expect(contract.connect(anonymous).updateTokenSupply(10, 100)).to.be.revertedWith(NOT_CURRENT_OWNER);
//         await contract.connect(deployer).updateTokenSupply(10, 100);
//     });

//     it("Only Owner will be able to updateTokenSupply for valid tokenId", async function () {
//         await expect(contract.connect(deployer).updateTokenSupply(100, 100)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
//         await contract.connect(deployer).updateTokenSupply(10, 100);
//     });

//     it("Only Owner will not be able to updateTokenSupply if already that amount minted", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mint(anonymous.address, 4, 200);

//         let tokenInfo = await contract.getTokenInfo(4);
//         expect(Number(tokenInfo.tokenId)).to.equal(4);
//         expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(200);
//         expect(Number(tokenInfo.maximumTokenSupply)).to.equal(200);

//         await expect(contract.connect(deployer).updateTokenSupply(4, 100)).to.be.revertedWithCustomError(contract, "InvalidInput");
//         await contract.connect(deployer).updateTokenSupply(4, 500);

//         tokenInfo = await contract.getTokenInfo(4);
//         expect(Number(tokenInfo.tokenId)).to.equal(4);
//         expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(200);
//         expect(Number(tokenInfo.maximumTokenSupply)).to.equal(500);

//         await expect(contract.connect(minter).mint(anonymous.address, 4, 500)).to.be.revertedWithCustomError(
//             contract,
//             "MintAmountForTokenTypeExceeded"
//         );

//         contract.connect(minter).mint(anonymous.address, 4, 300);
//     });
// });

// describe("Mint Batch functionality", function () {
//     it("Only Minter will be able to mint batch token", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(deployer).mintBatch(anonymous.address, [4], [10])).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await expect(contract.connect(anonymous).mintBatch(anonymous.address, [4], [10])).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);
//     });

//     it("Minter will be able to mint token for valid address", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);

//         await expect(contract.connect(minter).mintBatch("0x0000000000000000000000000000000000000000", [4], [10])).to.be.revertedWithCustomError(
//             contract,
//             "InvalidAddress"
//         );
//     });

//     it("Minter will be able to mint token when minting is active", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);

//         await contract.connect(deployer).setMintingStatus(false);
//         await expect(contract.connect(minter).mintBatch(anonymous.address, [4], [10])).to.be.revertedWithCustomError(contract, "MintingNotActive");

//         await contract.connect(deployer).setMintingStatus(true);
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);
//     });

//     it("Minter will be able to mint token valid token ID", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [0], [10])).to.be.revertedWithCustomError(contract, "InvalidTokenId");

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [100], [10])).to.be.revertedWithCustomError(contract, "InvalidTokenId");
//     });

//     it("Minter will be able to mint token valid input", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);
//         await contract.connect(minter).mintBatch(anonymous.address, [4], [10]);

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [4, 5], [10])).to.be.revertedWithCustomError(contract, "InvalidInput");

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [4], [10, 20])).to.be.revertedWithCustomError(contract, "InvalidInput");
//         await expect(contract.connect(minter).mintBatch(anonymous.address, [], [])).to.be.revertedWithCustomError(contract, "InvalidInput");
//     });

//     it("Minter will be able to mint token valid amount", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [4], [0])).to.be.revertedWithCustomError(contract, "ValueCanNotBeZero");

//         await expect(contract.connect(minter).mintBatch(anonymous.address, [4], [1000])).to.be.revertedWithCustomError(
//             contract,
//             "MintAmountForTokenTypeExceeded"
//         );

//         await contract.connect(minter).mintBatch(anonymous.address, [4], [200]);

//         let tokenInfo = await contract.getTokenInfo(4);
//         expect(Number(tokenInfo.tokenId)).to.equal(4);
//         expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(200);
//         expect(Number(tokenInfo.maximumTokenSupply)).to.equal(200);
//     });

//     it("Minter will be able to mint all token at a time", async function () {
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         let tokenIds = [];
//         let amounts = [];

//         for (let i = 1; i <= 12; i++) {
//             tokenIds.push(i);
//             amounts.push(200);
//         }

//         await contract.connect(minter).mintBatch(anonymous.address, tokenIds, amounts);

//         for (let index = 1; index <= 12; index++) {
//             let tokenId = index;
//             let tokenInfo = await contract.getTokenInfo(tokenId);
//             expect(Number(tokenInfo.tokenId)).to.equal(index);
//             expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(200);
//             expect(Number(tokenInfo.maximumTokenSupply)).to.equal(200);
//             const uri = await contract.uri(index);
//             expect(uri).to.equal(`${METADATA_BASE_URI}${index}`);
//         }
//     });
// });

// describe("Contract Owner Functionality", function () {
//     it("Deployer should be initial contract owner", async function () {
//         const contractOwner = await contract.owner();
//         expect(contractOwner).to.equal(deployer.address);
//     });

//     it("transferOwnership call from anonymous wallet should through error", async function () {
//         await expect(contract.connect(anonymous).transferOwnership(newContractOwner.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
//     });

//     it("Only the contract owner can call the transferOwnership method", async function () {
//         await contract.connect(deployer).transferOwnership(newContractOwner.address);
//     });

//     it("After successfully calling transferOwnership method new wallet will be contract owner", async function () {
//         await contract.connect(deployer).transferOwnership(newContractOwner.address);
//         const contractOwner = await contract.owner();
//         expect(contractOwner).to.equal(newContractOwner.address);
//     });

//     it("After changing contract owner previous owner will get error while calling transferOwnership method", async function () {
//         await contract.connect(deployer).transferOwnership(newContractOwner.address);
//         const contractOwner = await contract.owner();
//         expect(contractOwner).to.equal(newContractOwner.address);
//         await expect(contract.connect(deployer).transferOwnership(newContractOwner.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
//     });
// });

// describe("setAllowedToTransfer functionality", function () {
//     it("Only Owner will be able to setAllowedToTransfer", async function () {
//         await expect(contract.connect(anonymous).setAllowedToTransfer(allowedToTransfer.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);
//     });

//     it("Owner will be able to setAllowedToTransfer to both true and false status", async function () {
//         let allowedToTransferStatus = await contract.isAllowedToTransfer(allowedToTransfer.address);
//         expect(allowedToTransferStatus).to.be.false;

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);
//         allowedToTransferStatus = await contract.isAllowedToTransfer(allowedToTransfer.address);
//         expect(allowedToTransferStatus).to.be.true;

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, false);
//         allowedToTransferStatus = await contract.isAllowedToTransfer(allowedToTransfer.address);
//         expect(allowedToTransferStatus).to.be.false;
//     });

//     it("Owner will be able to set zero address as setAllowedToTransfer address", async function () {
//         await expect(contract.setAllowedToTransfer("0x0000000000000000000000000000000000000000", true)).to.be.revertedWithCustomError(
//             contract,
//             "InvalidAddress"
//         );
//     });
// });

// describe("safeTransferFrom functionality", function () {
//     it("Only allowed wallet will be able to transfer token", async function () {
//         let balance;
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(deployer).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await expect(contract.connect(anonymous).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");

//         await contract.connect(minter).mint(anonymous.address, 4, 10);
//         await contract.connect(minter).mint(allowedToTransfer.address, 4, 10);
//         await contract.connect(minter).mint(minter.address, 4, 10);
//         await contract.connect(minter).mint(deployer.address, 4, 10);

//         await expect(
//             contract.connect(deployer).safeTransferFrom(deployer.address, anonymous.address, 4, 10, contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(anonymous).safeTransferFrom(anonymous.address, allowedToTransfer.address, 4, 10, contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(minter).safeTransferFrom(minter.address, anonymous.address, 4, 10, contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(allowedToTransfer).safeTransferFrom(allowedToTransfer.address, anonymous.address, 4, 10, contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);

//         balance = await contract.balanceOf(anonymous.address, 4);
//         expect(Number(balance)).to.be.equal(10);

//         balance = await contract.balanceOf(allowedToTransfer.address, 4);
//         expect(Number(balance)).to.be.equal(10);

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);
//         await contract.connect(allowedToTransfer).safeTransferFrom(allowedToTransfer.address, anonymous.address, 4, 5, contract.address);

//         balance = await contract.balanceOf(anonymous.address, 4);
//         expect(Number(balance)).to.be.equal(15);

//         balance = await contract.balanceOf(allowedToTransfer.address, 4);
//         expect(Number(balance)).to.be.equal(5);

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, false);
//         await expect(
//             contract.connect(allowedToTransfer).safeTransferFrom(allowedToTransfer.address, anonymous.address, 4, 5, contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//     });
// });

// describe("safeBatchTransferFrom functionality", function () {
//     it("Only allowed wallet will be able to transfer token", async function () {
//         let balance;
//         await contract.connect(deployer).setMinterAddress(minter.address, true);

//         await expect(contract.connect(deployer).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
//         await expect(contract.connect(anonymous).mint(anonymous.address, 4, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");

//         await contract.connect(minter).mint(anonymous.address, 4, 10);
//         await contract.connect(minter).mint(allowedToTransfer.address, 4, 10);
//         await contract.connect(minter).mint(minter.address, 4, 10);
//         await contract.connect(minter).mint(deployer.address, 4, 10);

//         await expect(
//             contract.connect(deployer).safeBatchTransferFrom(deployer.address, anonymous.address, [4], [10], contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(anonymous).safeBatchTransferFrom(anonymous.address, allowedToTransfer.address, [4], [10], contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(minter).safeBatchTransferFrom(minter.address, anonymous.address, [4], [10], contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//         await expect(
//             contract.connect(allowedToTransfer).safeBatchTransferFrom(allowedToTransfer.address, anonymous.address, [4], [10], contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);

//         balance = await contract.balanceOf(anonymous.address, 4);
//         expect(Number(balance)).to.be.equal(10);

//         balance = await contract.balanceOf(allowedToTransfer.address, 4);
//         expect(Number(balance)).to.be.equal(10);

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, true);
//         await contract.connect(allowedToTransfer).safeBatchTransferFrom(allowedToTransfer.address, anonymous.address, [4], [5], contract.address);

//         balance = await contract.balanceOf(anonymous.address, 4);
//         expect(Number(balance)).to.be.equal(15);

//         balance = await contract.balanceOf(allowedToTransfer.address, 4);
//         expect(Number(balance)).to.be.equal(5);

//         await contract.connect(deployer).setAllowedToTransfer(allowedToTransfer.address, false);
//         await expect(
//             contract.connect(allowedToTransfer).safeBatchTransferFrom(allowedToTransfer.address, anonymous.address, [4], [5], contract.address)
//         ).to.be.revertedWithCustomError(contract, "NotAllowedToTransfer");
//     });
});

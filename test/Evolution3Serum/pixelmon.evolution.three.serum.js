const { expect } = require("chai");
const { ethers } = require("hardhat");
const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";
const METADATA_BASE_URI = "https://www.metadata.com/";
const NEW_METADATA_BASE_URI = "https://www.newmetadata.com/";

let deployerWallet; 
let anonymousWallet;
let newContractOwnerWallet; 
let minterWallet;
let burnerWallet;

let contract;

async function deployContract() {
    const Evolution3Serum = await hre.ethers.getContractFactory("Evolution3Serum");
    const evolution3Serum = await Evolution3Serum.deploy(METADATA_BASE_URI);
    await evolution3Serum.deployed();

    let accounts = await ethers.getSigners();
    deployerWallet = accounts[0];
    anonymousWallet = accounts[1];
    newContractOwnerWallet = accounts[2];
    minterWallet = accounts[3];
    burnerWallet = accounts[4];

    return evolution3Serum;
}

beforeEach(async function () {
    contract = await deployContract();
});

describe("Deployment test", async function () {
    it("Contract should be successfully deployed", async function () {
        const Evolution3Serum = await hre.ethers.getContractFactory("Evolution3Serum");
        const evolution3Serum = await Evolution3Serum.deploy(METADATA_BASE_URI);
        await evolution3Serum.deployed();
    });

    it("Contract should should not deploy without metadata url as parameter", async function () {
        const Evolution3Serum = await hre.ethers.getContractFactory("Evolution3Serum");
        let errorReason = "";
        try {
            await Evolution3Serum.deploy();
        } catch (error) {
            errorReason = error.reason;
        } finally {
            expect(errorReason).to.equal("missing argument:  in Contract constructor");
        }
    });

    it("Contract should should not deploy with invalid parameter", async function () {
        const Evolution3Serum = await hre.ethers.getContractFactory("Evolution3Serum");
        let errorReason = "";
        try {
            await Evolution3Serum.deploy(1, 5);
        } catch (error) {
            errorReason = error.reason;
        } finally {
            expect(errorReason).to.equal("too many arguments:  in Contract constructor");
        }
    });

    it("Deployer should be the initial contract owner", async function () {
        const ownerAddress = await contract.owner();
        expect(ownerAddress).to.equal(deployerWallet.address);
    });
});

describe("Base URI functionality", function () {
    it("Base URI should be set initially", async function () {
        const baseURI = await contract.baseURI();
        expect(baseURI).to.equal(METADATA_BASE_URI);
    });

    it("Only Owner will be able to set base URI", async function () {
        await expect(contract.connect(anonymousWallet).setURI(NEW_METADATA_BASE_URI)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(deployerWallet).setURI(NEW_METADATA_BASE_URI);

        const baseURI = await contract.baseURI();
        expect(baseURI).to.equal(NEW_METADATA_BASE_URI);
    });
});

describe("Token Info functionality", function () {
    it("There should be 1 total token initially", async function () {
        const totalToken = await contract.totalToken();
        expect(Number(totalToken)).to.equal(1);
    });

    it("Initial token supply should be 1000", async function () {
        let tokenId = 1;
        let tokenInfo = await contract.getTokenInfo(tokenId);
        expect(Number(tokenInfo.tokenId)).to.equal(tokenId);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(0);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(1000);
    });

    it("getTokenInfo should provide error for invalid tokenId", async function () {
        await expect(contract.getTokenInfo(1000)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
    });
});

describe("Add Token Info functionality", function () {
    it("Only Owner will be able to addTokenInfo", async function () {
        await expect(contract.connect(anonymousWallet).addTokenInfo(10)).to.be.revertedWith(NOT_CURRENT_OWNER);

        await contract.connect(deployerWallet).addTokenInfo(10);

        const totalToken = await contract.totalToken();
        expect(Number(totalToken)).to.equal(2);

        let tokenInfo = await contract.getTokenInfo(2);
        expect(Number(tokenInfo.tokenId)).to.equal(2);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(0);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(10);
    });
});

describe("Set Minter Address functionality", function () {
    it("Only Owner will be able to setMinterAddress", async function () {
        await expect(contract.connect(anonymousWallet).setMinterAddress(minterWallet.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
    });

    it("Owner will be able to setMinterAddress to both true and false status", async function () {
        let minterStatus = await contract.minterList(minterWallet.address);
        expect(minterStatus).to.be.false;

        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        minterStatus = await contract.minterList(minterWallet.address);
        expect(minterStatus).to.be.true;

        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, false);
        minterStatus = await contract.minterList(minterWallet.address);
        expect(minterStatus).to.be.false;
    });

    it("Owner will be able to set zero address as minter address", async function () {
        await expect(contract.setMinterAddress("0x0000000000000000000000000000000000000000", true)).to.be.revertedWithCustomError(
            contract,
            "InvalidAddress"
        );
    });
});

describe("Set Burner Address functionality", function () {
    it("Only Owner will be able to setBurnerAddress", async function () {
        await expect(contract.connect(anonymousWallet).setBurnerAddress(burnerWallet.address, true)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
    });

    it("Owner will be able to setBurnerAddress to both true and false status", async function () {
        let burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.false;

        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
        burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.true;

        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, false);
        burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.false;
    });

    it("Owner will be able to set zero address as minter address", async function () {
        await expect(contract.setBurnerAddress("0x0000000000000000000000000000000000000000", true)).to.be.revertedWithCustomError(
            contract,
            "InvalidAddress"
        );
    });
});

describe("Mint functionality", function () {
    it("Only Minter will be able to mint token", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

        await expect(contract.connect(deployerWallet).mint(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
        await expect(contract.connect(anonymousWallet).mint(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidMinter");
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);
    });

    it("Minter will be able to mint token for valid address", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);

        await expect(contract.connect(minterWallet).mint("0x0000000000000000000000000000000000000000", 1, 10)).to.be.revertedWithCustomError(
            contract,
            "InvalidAddress"
        );
    });

    it("Minter will be able to mint token valid token ID", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 0, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 100, 10)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
    });

    it("Minter will be able to mint token valid amount", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 1, 0)).to.be.revertedWithCustomError(contract, "ValueCanNotBeZero");

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1001)).to.be.revertedWithCustomError(
            contract,
            "MintAmountForTokenIDExceeded"
        );

        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);

        let tokenInfo = await contract.getTokenInfo(1);
        expect(Number(tokenInfo.tokenId)).to.equal(1);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(1000);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(1000);
    });
});

describe("updateTokenSupply functionality", function () {
    it("Only Owner will be able to updateTokenSupply", async function () {
        await expect(contract.connect(anonymousWallet).updateTokenSupply(1, 100)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(deployerWallet).updateTokenSupply(1, 100);
    });

    it("Only Owner will be able to updateTokenSupply for valid tokenId", async function () {
        await expect(contract.connect(deployerWallet).updateTokenSupply(100, 100)).to.be.revertedWithCustomError(contract, "InvalidTokenId");
        await contract.connect(deployerWallet).updateTokenSupply(1, 100);
    });

    it("Only Owner will not be able to updateTokenSupply if already that amount minted", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);

        let tokenInfo = await contract.getTokenInfo(1);
        expect(Number(tokenInfo.tokenId)).to.equal(1);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(1000);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(1000);

        await expect(contract.connect(deployerWallet).updateTokenSupply(1, 100)).to.be.revertedWithCustomError(contract, "InvalidInput");
        await contract.connect(deployerWallet).updateTokenSupply(1, 1500);

        tokenInfo = await contract.getTokenInfo(1);
        expect(Number(tokenInfo.tokenId)).to.equal(1);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(1000);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(1500);

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1500)).to.be.revertedWithCustomError(
            contract,
            "MintAmountForTokenIDExceeded"
        );

        contract.connect(minterWallet).mint(anonymousWallet.address, 1, 500);
    });

    it("Minter will be able to mint token valid amount", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 1, 0)).to.be.revertedWithCustomError(contract, "ValueCanNotBeZero");

        await expect(contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1500)).to.be.revertedWithCustomError(
            contract,
            "MintAmountForTokenIDExceeded"
        );

        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);

        let tokenInfo = await contract.getTokenInfo(1);
        expect(Number(tokenInfo.tokenId)).to.equal(1);
        expect(Number(tokenInfo.totalMintedTokenAmount)).to.equal(1000);
        expect(Number(tokenInfo.maximumTokenSupply)).to.equal(1000);
    });
});

describe("Burn functionality", function () {
    it("Only Burner will be able to burn token", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);
        let balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidBurner");
        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
        let burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.true;

        await contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 10);

        balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(990);
    });

    it("Zero amount can not be burn", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);
        let balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidBurner");
        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
        let burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.true;

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 0)).to.be.revertedWithCustomError(contract, "ValueCanNotBeZero");

        balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);
    });

    it("Invalid tokenId can not be burn", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);
        let balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidBurner");
        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
        let burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.true;

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 2, 100)).to.be.revertedWithCustomError(contract, "InvalidTokenId");

        balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);
    });

    it("More than balance can not be burnt", async function () {
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 1000);
        let balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 10)).to.be.revertedWithCustomError(contract, "InvalidBurner");
        await contract.connect(deployerWallet).setBurnerAddress(burnerWallet.address, true);
        let burnerStatus = await contract.burnerList(burnerWallet.address);
        expect(burnerStatus).to.be.true;

        await expect(contract.connect(burnerWallet).burn(anonymousWallet.address, 1, 5000)).to.be.revertedWith(
            "ERC1155: burn amount exceeds balance"
        );

        balance = Number(await contract.balanceOf(anonymousWallet.address, 1));
        expect(balance).to.equal(1000);
    });
});

describe("Contract Owner Functionality", function () {
    it("Deployer should be initial contract owner", async function () {
        const contractOwner = await contract.owner();
        expect(contractOwner).to.equal(deployerWallet.address);
    });

    it("transferOwnership call from anonymous wallet should through error", async function () {
        await expect(contract.connect(anonymousWallet).transferOwnership(newContractOwnerWallet.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
    });

    it("Only the contract owner can call the transferOwnership method", async function () {
        await contract.connect(deployerWallet).transferOwnership(newContractOwnerWallet.address);
    });

    it("After successfully calling transferOwnership method new wallet will be contract owner", async function () {
        await contract.connect(deployerWallet).transferOwnership(newContractOwnerWallet.address);
        const contractOwner = await contract.owner();
        expect(contractOwner).to.equal(newContractOwnerWallet.address);
    });

    it("After changing contract owner previous owner will get error while calling transferOwnership method", async function () {
        await contract.connect(deployerWallet).transferOwnership(newContractOwnerWallet.address);
        const contractOwner = await contract.owner();
        expect(contractOwner).to.equal(newContractOwnerWallet.address);
        await expect(contract.connect(deployerWallet).transferOwnership(newContractOwnerWallet.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
    });
});

describe("Override functionality", function () {
    it("Support interface method test for coverage", async function () {
        let interfaceTest = await contract.supportsInterface("0xd9b67a26");
        expect(interfaceTest).to.be.true;
        interfaceTest = await contract.supportsInterface("0x4e2312e0");
        expect(interfaceTest).to.be.false;
    });

    it("Set approval for all test coverage", async function () {
        let balance;
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(burnerWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(minterWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(deployerWallet.address, 1, 10);

        balance = await contract.balanceOf(anonymousWallet.address, 1);
        expect(Number(balance)).to.be.equal(10);

        balance = await contract.balanceOf(burnerWallet.address, 1);
        expect(Number(balance)).to.be.equal(10);

        await expect(
            contract.connect(anonymousWallet).safeTransferFrom(burnerWallet.address, anonymousWallet.address, 1, 5, contract.address)
        ).to.be.revertedWith("ERC1155: caller is not token owner or approved");

        await contract.connect(burnerWallet).setApprovalForAll(anonymousWallet.address, true);
        let isApproved = await contract.isApprovedForAll(burnerWallet.address, anonymousWallet.address);
        expect(isApproved).to.be.true;

        await contract.connect(anonymousWallet).safeTransferFrom(burnerWallet.address, anonymousWallet.address, 1, 5, contract.address);

        balance = await contract.balanceOf(anonymousWallet.address, 1);
        expect(Number(balance)).to.be.equal(15);

        balance = await contract.balanceOf(burnerWallet.address, 1);
        expect(Number(balance)).to.be.equal(5);

        await contract.connect(burnerWallet).setApprovalForAll(anonymousWallet.address, false);
        isApproved = await contract.isApprovedForAll(burnerWallet.address, anonymousWallet.address);
        expect(isApproved).to.be.false;

        await expect(
            contract.connect(anonymousWallet).safeTransferFrom(burnerWallet.address, anonymousWallet.address, 1, 5, contract.address)
        ).to.be.revertedWith("ERC1155: caller is not token owner or approved");
    });
});

describe("safeTransferFrom functionality", function () {
    it("Only token holder wallet will be able to transfer token", async function () {
        let balance;
        await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

        await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(burnerWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(minterWallet.address, 1, 10);
        await contract.connect(minterWallet).mint(deployerWallet.address, 1, 10);

        balance = await contract.balanceOf(anonymousWallet.address, 1);
        expect(Number(balance)).to.be.equal(10);

        balance = await contract.balanceOf(burnerWallet.address, 1);
        expect(Number(balance)).to.be.equal(10);

        await contract.connect(burnerWallet).safeTransferFrom(burnerWallet.address, anonymousWallet.address, 1, 5, contract.address);

        balance = await contract.balanceOf(anonymousWallet.address, 1);
        expect(Number(balance)).to.be.equal(15);

        balance = await contract.balanceOf(burnerWallet.address, 1);
        expect(Number(balance)).to.be.equal(5);
    });
});

it("Only token holder wallet will be able to transfer token", async function () {
    let balance;
    await contract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);

    await contract.connect(minterWallet).mint(anonymousWallet.address, 1, 10);
    await contract.connect(minterWallet).mint(burnerWallet.address, 1, 10);
    await contract.connect(minterWallet).mint(minterWallet.address, 1, 10);
    await contract.connect(minterWallet).mint(deployerWallet.address, 1, 10);

    balance = await contract.balanceOf(anonymousWallet.address, 1);
    expect(Number(balance)).to.be.equal(10);

    balance = await contract.balanceOf(burnerWallet.address, 1);
    expect(Number(balance)).to.be.equal(10);

    await contract.connect(burnerWallet).safeBatchTransferFrom(burnerWallet.address, anonymousWallet.address, [1], [5], contract.address);

    balance = await contract.balanceOf(anonymousWallet.address, 1);
    expect(Number(balance)).to.be.equal(15);

    balance = await contract.balanceOf(burnerWallet.address, 1);
    expect(Number(balance)).to.be.equal(5);
});

describe(`uri function test`, function () {
    it("Should consistently return the same token metadata URI", async function () {
        const tokenURI = `${METADATA_BASE_URI}1`;
        let token = 1;
        expect(await contract.uri(token)).to.equal(tokenURI);
    });
    it("Should return empty string if no baseURI available", async function () {
        const tokenURI = "";
        const token = 1;
        await contract.setURI("");
        expect(await contract.uri(token)).to.equal(tokenURI);
    });
});

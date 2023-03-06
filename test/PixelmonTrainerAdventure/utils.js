const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";
const METADATA_BASE_URI = "https://www.metadata.com/";
const NEW_METADATA_BASE_URI = "https://www.newmetadata.com/";

function getMerkleRoot(whiteListedAddress) {
    // console.log(whiteListedAddress);
    const leafNodes = whiteListedAddress.map((addr) => keccak256(addr));
    // console.log(leafNodes);
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getRoot();

    const claimingAddress = leafNodes[0];
    const hexProof = merkleTree.getHexProof(claimingAddress);

    return { rootHash, hexProof };
}

async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployerWallet = accounts[0];
    const anonymousWallet = accounts[9];
    const newContractOwnerWallet = accounts[8];
    const minterWallet = accounts[7];
    const allowedToTransferWallet = accounts[6];
    const moderatorWallet = accounts[5];
    const verifyWallet = accounts[3];

    const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
    const pixelmonTrainerGearContract = await PixelmonTrainerGear.deploy(METADATA_BASE_URI);
    await pixelmonTrainerGearContract.deployed();

    await pixelmonTrainerGearContract.connect(deployerWallet).setMinterAddress(minterWallet.address, true);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 1, 150);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 2, 150);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 3, 150);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 4, 150);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 5, 150);
    await pixelmonTrainerGearContract.connect(minterWallet).mint(minterWallet.address, 6, 150);

    const MuNFT = await ethers.getContractFactory("MockNFT");
    const muNFT = await MuNFT.deploy();
    await muNFT.deployed();

    await muNFT.safeMint(minterWallet.address);
    await muNFT.safeMint(minterWallet.address);
    await muNFT.safeMint(minterWallet.address);
    await muNFT.safeMint(minterWallet.address);
    await muNFT.safeMint(minterWallet.address);
    await muNFT.safeMint(minterWallet.address);

    const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
    const mockVRFCoordinator = await MockVRFCoordinator.deploy();
    await mockVRFCoordinator.deployed();

    let _vrfCoordinator = mockVRFCoordinator.address;
    let _subscriptionId = "2227";
    let _keyHash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
    const PixelmonTrainerAdventure = await hre.ethers.getContractFactory("PixelmonTrainerAdventure");
    const pixelmonTrainerAdventure = await PixelmonTrainerAdventure.deploy(_vrfCoordinator, _subscriptionId, _keyHash);

    await pixelmonTrainerAdventure.deployed();

    const whiteListedWalletAddress = [accounts[3].address, accounts[4].address, accounts[5].address, accounts[6].address];

    const { rootHash, hexProof } = getMerkleRoot(whiteListedWalletAddress);
    const previousBlockNumber = await ethers.provider.getBlockNumber();
    const previousBlock = await ethers.provider.getBlock(previousBlockNumber);
    const previousBlockTimeStamp = previousBlock.timestamp;

    return {
        minterWallet,
        deployerWallet,
        anonymousWallet,
        newContractOwnerWallet,
        pixelmonTrainerGearContract,
        allowedToTransferWallet,
        pixelmonTrainerAdventure,
        muNFT,
        moderatorWallet,
        rootHash,
        hexProof,
        verifyWallet,
        previousBlockTimeStamp
    };
}

module.exports = {
    deployContract,
    METADATA_BASE_URI,
    NOT_CURRENT_OWNER,
    NEW_METADATA_BASE_URI,
};

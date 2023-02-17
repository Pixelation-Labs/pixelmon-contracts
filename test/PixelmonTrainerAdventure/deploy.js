const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";
const METADATA_BASE_URI = "https://www.metadata.com/";

function getMerkleRoot(whiteListedAddress) {
    const leafNodes = whiteListedAddress.map((addr) => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHashUtils = merkleTree.getRoot();
    const claimingAddress1 = leafNodes[0];
    const hexProofUtils1 = merkleTree.getHexProof(claimingAddress1);
    const claimingAddress2 = leafNodes[1];
    const hexProofUtils2 = merkleTree.getHexProof(claimingAddress2);
    
    return { rootHashUtils, hexProofUtils1,hexProofUtils2 };
}


async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployerWalletUtils = accounts[0];
    const minterWalletUtils = accounts[5];
    const newContractOwnerUtils = accounts[6];
    const adminWalletUtils = accounts[7];
    const moderatorWalletUtils = accounts[8];
    const anonymousWalletUtils = accounts[9];
    const verifyWalletUtils1 = accounts[2];
    const verifyWalletUtils2 = accounts[3];

    const PixelmonTrainerGear = await hre.ethers.getContractFactory("PixelmonTrainerGear");
    const pixelmonTrainerGearContractUtils = await PixelmonTrainerGear.deploy(METADATA_BASE_URI);
    await pixelmonTrainerGearContractUtils.deployed();

    await pixelmonTrainerGearContractUtils.connect(deployerWalletUtils).setMinterAddress(minterWalletUtils.address, true);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 1, 150);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 2, 150);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 3, 150);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 4, 150);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 5, 150);
    await pixelmonTrainerGearContractUtils.connect(minterWalletUtils).mint(minterWalletUtils.address, 6, 150);


    const MockNFT = await ethers.getContractFactory("MockNFT");
    const mockERC721Utils = await MockNFT.deploy();
    await mockERC721Utils.deployed();

    await mockERC721Utils.safeMint(minterWalletUtils.address);
    await mockERC721Utils.safeMint(minterWalletUtils.address);
    await mockERC721Utils.safeMint(minterWalletUtils.address);
    await mockERC721Utils.safeMint(minterWalletUtils.address);
    await mockERC721Utils.safeMint(minterWalletUtils.address);
    await mockERC721Utils.safeMint(minterWalletUtils.address);

    
    const MockVRFCoordinator = await hre.ethers.getContractFactory("MockVRFCoordinator");
    const mockVRFCoordinator = await MockVRFCoordinator.deploy();
    await mockVRFCoordinator.deployed();

    let _vrfCoordinator = mockVRFCoordinator.address;

    let _subscriptionId = process.env.SUBSCRIPTION_ID;
    let _keyHash = process.env.KEY_HASH;
    const PixelmonTrainerAdventure = await hre.ethers.getContractFactory("PixelmonTrainerAdventure");
    const pixelmonTrainerUtils = await PixelmonTrainerAdventure.deploy(_vrfCoordinator, _subscriptionId, _keyHash);

    await pixelmonTrainerUtils.deployed();

    const whiteListedWalletAddress = [accounts[2].address, accounts[3].address, accounts[4].address, accounts[5].address];
    const { rootHashUtils, hexProofUtils1,hexProofUtils2 } = getMerkleRoot(whiteListedWalletAddress);
    const previousBlockNumber = await ethers.provider.getBlockNumber();
    const previousBlock = await ethers.provider.getBlock(previousBlockNumber);
    const previousBlockTimeStamp = previousBlock.timestamp;

    return {
        deployerWalletUtils,
        minterWalletUtils,
        adminWalletUtils,
        moderatorWalletUtils,
        anonymousWalletUtils,
        newContractOwnerUtils,
        pixelmonTrainerUtils,
        pixelmonTrainerGearContractUtils,
        rootHashUtils,
        hexProofUtils1,
        verifyWalletUtils1,
        hexProofUtils2,
        verifyWalletUtils2,
        mockERC721Utils,
        previousBlockTimeStamp
    };
}

module.exports = {
    deployContract,
    METADATA_BASE_URI,
    NOT_CURRENT_OWNER,
};

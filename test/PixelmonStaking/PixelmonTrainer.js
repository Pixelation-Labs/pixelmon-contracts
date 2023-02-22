const { expect } = require("chai");
const { ethers } = require("hardhat");

const pixelmonTrainerContractName = "PixelmonTrainer";

describe(`${pixelmonTrainerContractName} contract`, function () {
  let pixelContract;
  let testUsers;
  let firstRangeMaxSupply;

  let totalSupply = 0;

  const baseURI = "https://pixelmon.club/api/trainers/";
  const erc721Name = "PixelmonTrainer";
  const erc721Symbol = "PIX";

  it("should deploy contract", async function () {
    testUsers = await ethers.getSigners();

    const PixelmonTrainer = await ethers.getContractFactory(
      pixelmonTrainerContractName
    );

    pixelContract = await PixelmonTrainer.deploy(
      erc721Name,
      erc721Symbol,
      baseURI
    );

    await pixelContract.deployed();

    await pixelContract.whitelistAddress(testUsers[0].address, true);

    firstRangeMaxSupply = await pixelContract.FIRST_RANGE_MAX_SUPPLY();

    expect(await pixelContract.symbol()).to.equal(erc721Symbol);
    expect(await pixelContract.name()).to.equal(erc721Name);
    expect(await pixelContract.baseURI()).to.equal(baseURI);
  });

  it("should restrict calling whitelistAddress to owner only", async function () {
    const caller = testUsers[5];

    await expect(
      pixelContract.connect(caller).whitelistAddress(caller.address, true)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should restrict calling setBaseURI to owner only", async function () {
    const caller = testUsers[5];

    await expect(
      pixelContract.connect(caller).setBaseURI("new-uri")
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should restrict calling airdropGoldTrainers to owner only", async function () {
    const caller = testUsers[7];

    await expect(
      pixelContract.connect(caller).airdropGoldTrainers([])
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should add/remove adddress to/from whitelist and emit events", async function () {
    const wallet = testUsers[6];

    expect(await pixelContract.isWhitelisted(wallet.address)).to.be.false;

    expect(await pixelContract.whitelistAddress(wallet.address, true))
      .to.emit(pixelContract, "WhitelistAddress")
      .withArgs(wallet.address, true);

    expect(await pixelContract.isWhitelisted(wallet.address)).to.be.true;

    expect(await pixelContract.whitelistAddress(wallet.address, false))
      .to.emit(pixelContract, "WhitelistAddress")
      .withArgs(wallet.address, false);

    expect(await pixelContract.isWhitelisted(wallet.address)).to.be.false;
  });

  it("should set new base uri", async function () {
    const newBaseUri = "https://new-base-uri/";

    expect(await pixelContract.setBaseURI(newBaseUri))
      .to.emit(pixelContract, "SetBaseURI")
      .withArgs(newBaseUri);

    expect(await pixelContract.baseURI()).to.equal(newBaseUri);

    await pixelContract.setBaseURI(baseURI);

    expect(await pixelContract.baseURI()).to.equal(baseURI);
  });

  it("should restrict calling mintRangeOne to whitelisted addresses", async function () {
    const caller = testUsers[6];

    await expect(
      pixelContract.connect(caller).mintRangeOne(caller.address, 1)
    ).to.be.revertedWithCustomError(pixelContract, "NotWhitelisted");
  });

  it("should mint 1 token from first range", async function () {
    const tokens = 1;
    const firstRangeSupply = await pixelContract.firstRangeSupply();
    const to = testUsers[1].address;

    expect(await pixelContract.mintRangeOne(to, tokens));

    expect(await pixelContract.ownerOf(tokens)).to.equal(to);
    expect(await pixelContract.firstRangeSupply()).to.equal(
      firstRangeSupply.add(tokens)
    );

    ++totalSupply;
  });

  it("should batch mint tokens from first range", async function () {
    const to = testUsers[2].address;
    const tokens = 10;
    const supplyBefore = await pixelContract.firstRangeSupply();
    const startId = supplyBefore.add(1);

    await pixelContract.mintRangeOne(to, tokens);

    expect(await pixelContract.firstRangeSupply()).to.equal(
      supplyBefore.add(tokens)
    );

    for (let i = 0; i < tokens; ++i) {
      const tokenId = startId.toNumber() + i;

      expect(await pixelContract.ownerOf(tokenId)).to.equal(to);
    }

    totalSupply += tokens;
  });

  it("should revert get tokenURI for non existing token", async function () {
    const tokenId = (await pixelContract.FIRST_RANGE_MAX_SUPPLY()).toNumber();

    await expect(pixelContract.tokenURI(tokenId)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("should get tokenURI", async function () {
    const tokenId = await pixelContract.firstRangeSupply();

    expect(await pixelContract.tokenURI(tokenId)).to.equal(baseURI + tokenId);
  });

  it("should allow airdrop of only 20 gold trainers", async function () {
    let addresses = [];

    for (let i = 0; i < 30; ++i) {
      addresses.push(testUsers[5].address);
    }

    await expect(
      pixelContract.airdropGoldTrainers(addresses)
    ).to.be.revertedWithCustomError(pixelContract, "InvalidInputArrayLength");
  });

  it("should airdrop gold trainers", async function () {
    const addresses = testUsers.map((user) => user.address);

    await pixelContract.airdropGoldTrainers(addresses);

    const secondRangeTokenId =
      firstRangeMaxSupply.toNumber() + 1;

    for (let i = 0; i < addresses.length; ++i) {
      expect(await pixelContract.ownerOf(secondRangeTokenId + i)).to.equal(
        addresses[i]
      );
    }

    totalSupply += (await pixelContract.SECOND_RANGE_MAX_SUPPLY()).toNumber();
  });

  it("should revert another airdrop of gold trainers", async function () {
    const addresses = testUsers.map((user) => user.address);

    await expect(
      pixelContract.airdropGoldTrainers(addresses)
    ).to.be.revertedWithCustomError(pixelContract, "MintAmountExceeded");
  });

  it("should get total supply", async function () {
    expect(await pixelContract.totalSupply()).to.equal(totalSupply);
  });

  describe("max supply restrictions range 1 (long running)", async function () {
    before(async () => {
      const currentSupply = await pixelContract.firstRangeSupply();

      let tokensToMint = firstRangeMaxSupply.sub(currentSupply).toNumber();

      const step = 1000;
      const batches = Math.floor(tokensToMint / 1000);

      for (let i = 0; i <= batches; ++i) {
        const mintBatchStep = tokensToMint > step ? step : tokensToMint;

        await pixelContract.mintRangeOne(testUsers[0].address, mintBatchStep);

        tokensToMint -= step;
      }
    });

    it("should revert minting in range 1 after max supply reached", async function () {
      await expect(
        pixelContract.mintRangeOne(testUsers[4].address, 1)
      ).to.be.revertedWithCustomError(pixelContract, "MintAmountExceeded");
    });
  });
});

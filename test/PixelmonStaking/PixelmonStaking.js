const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

const testContractName = "PixelmonStaking";
const erc721MockContractName = "ERC721Mock";
const pixelmonTrainerContractName = "PixelmonTrainer";
const baseURI = "https://pixelmon.club/api/trainers/";

describe("PixelmonStaking contract", function () {
  let testUsers;
  let pixelmon;
  let pixelmonTrainer;
  let staking;
  let randomSignature; 

  async function createSignature(tokenIdArray, tokenOwner, contract, signer) {
    const tokenIds = await contract.hashTokenIds(tokenIdArray);
    const signatureObject = {tokenIds, tokenOwner};
    const chainId = await contract.getChainID();
    const SIGNING_DOMAIN_NAME = "Pixelmon-Staking";
    const SIGNING_DOMAIN_VERSION = "1";
    const types = {
      PixelmonSignature: [
        {name: "tokenIds", type: "uint256"},
        {name: "tokenOwner", type: "address"} 
      ]
    }
    const domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: contract.address,
      chainId,
    }

    const signature = await signer._signTypedData(domain, types, signatureObject);
    return signature;
  }

  async function createInvalidSignature(tokenIdArray, tokenOwner, contract, signer, domainName, version) {
    const tokenIds = await contract.hashTokenIds(tokenIdArray);
    const signatureObject = {tokenIds, tokenOwner};
    const chainId = await contract.getChainID();
    const SIGNING_DOMAIN_NAME = domainName;
    const SIGNING_DOMAIN_VERSION = version;
    const types = {
      PixelmonSignature: [
        {name: "tokenIds", type: "uint256"},
        {name: "tokenOwner", type: "address"} 
      ]
    }
    const domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: contract.address,
      chainId,
    }

    const signature = await signer._signTypedData(domain, types, signatureObject);
    return signature;
  }

  before(async function () {
    testUsers = await ethers.getSigners();

    const erc721Factory = await ethers.getContractFactory(
      erc721MockContractName
    );

    pixelmon = await erc721Factory.deploy("Pixelmon", "PXLMN");

    await pixelmon.deployed();

    const pixelmonContractFactory = await ethers.getContractFactory(
      pixelmonTrainerContractName
    );

    pixelmonTrainer = await pixelmonContractFactory.deploy(
      "PixelmonTrainer",
      "TRNR",
      baseURI
    );

    await pixelmonTrainer.deployed();

    await pixelmonTrainer.whitelistAddress(testUsers[0].address, true);
  });

  describe("contract deployment", function () {
    it(`should revert deploy with zero Pixelmon address`, async function () {
      const pixelmonStakingFactory = await ethers.getContractFactory(
        testContractName
      );

      await expect(
        pixelmonStakingFactory.deploy(
          ethers.constants.AddressZero,
          pixelmonTrainer.address
        )
      ).to.be.reverted;
    });

    it(`should revert deploy with zero PixelmonTrainer address`, async function () {
      const pixelmonStakingFactory = await ethers.getContractFactory(
        testContractName
      );

      await expect(
        pixelmonStakingFactory.deploy(
          pixelmon.address,
          ethers.constants.AddressZero
        )
      ).to.be.reverted;
    });

    it(`should deploy new contract`, async function () {
      const pixelmonStakingFactory = await ethers.getContractFactory(
        testContractName
      );

      const staking = await pixelmonStakingFactory.deploy(
        pixelmon.address,
        pixelmonTrainer.address
      );

      expect(await staking.deployed());
      expect(await staking.pixelmonContract()).to.be.equal(pixelmon.address);
      expect(await staking.pixelmonTrainerContract()).to.be.equal(
        pixelmonTrainer.address
      );
    });
  });

  describe("contract functions", function () {
    let pixelmonLastTokenId = 1;
    let tokensPerOperationLimit;
    let tokensPerClaimLimit;

    async function mint(
      contract,
      startId,
      amount,
      to
    ) {
      let tokenIds = new Array(amount);

      for (let i = 0; i < amount; ++i) {
        let token = startId + i;

        tokenIds[i] = token;

        await contract.mint(to, token);
      }

      return tokenIds;
    }

    async function mintPixelmons(amount, to) {
      const res = await mint(pixelmon, pixelmonLastTokenId, amount, to);

      pixelmonLastTokenId += amount;
      const tokenIds = [];
      for(let i = 0; i < res.length; i++) {
        tokenIds.push(Number(res[i]));
      }
      return tokenIds;
    }

    async function mintTrainers(amount, to) {
      const res = await pixelmonTrainer.mintRangeOne(to, amount);

      return res;
    }

    async function checkStakeEvents(
      txn,
      staker,
      stakeTokens,
      rewardTokens
    ) {
      const receipt = await txn.wait();

      let eventsIndex = 0;

      for (const event of receipt.events) {
        if (event.event) {
          expect(event.event).equal("Staked");
          expect(event.args[0]).equal(staker);
          expect(event.args[1]).equal(stakeTokens[eventsIndex]);
          expect(event.args[2]).equal(rewardTokens[eventsIndex]);

          eventsIndex++;
        }
      }

      expect(eventsIndex).equal(stakeTokens.length);
    }

    async function checkUnstakeEvents(
      txn,
      stakeOwner,
      unstakeTokens
    ) {
      const receipt = await txn.wait();

      let eventsIndex = 0;

      for (const event of receipt.events) {
        if (event.event) {
          expect(event.event).equal("Unstaked");
          expect(event.args[0]).equal(stakeOwner);
          expect(event.args[1]).equal(unstakeTokens[eventsIndex]);

          eventsIndex++;
        }
      }

      expect(eventsIndex).equal(unstakeTokens.length);
    }

    before(async function () {
      const pixelmonStakingFactory = await ethers.getContractFactory(
        testContractName
      );

      staking = await pixelmonStakingFactory.deploy(
        pixelmon.address,
        pixelmonTrainer.address
      );

      expect(await staking.deployed());

      tokensPerOperationLimit = (
        await staking.MAX_TOKENS_PER_STAKE()
      ).toNumber();
      
      await mintTrainers(1000, staking.address);
      randomSignature = await createSignature([1, 2], testUsers[1].address, staking, testUsers[0]);
    });

    it("should restrict calling pause to owner only", async function () {
      const caller = testUsers[5];

      await expect(staking.connect(caller).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should restrict calling unpause to owner only", async function () {
      const caller = testUsers[5];

      await expect(staking.connect(caller).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should restrict calling rescueNFT to owner only", async function () {
      const caller = testUsers[5];

      await expect(
        staking.connect(caller).rescueNFT(pixelmon.address, caller.address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should restrict calling toggleEmergencyMode to owner only", async function () {
      const caller = testUsers[5];

      await expect(
        staking.connect(caller).toggleEmergencyMode(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should pause contract and emit event", async function () {
      expect(await staking.pause())
        .to.emit(staking, "Pause")
        .withArgs(testUsers[0].address);

      expect(await staking.paused()).to.be.true;
    });

    it("should unpause contract and emit event", async function () {
      expect(await staking.unpause())
        .to.emit(staking, "Unpause")
        .withArgs(testUsers[0].address);

      expect(await staking.paused()).to.be.false;
    });

    it("should revert rescueNFT for invalid token address", async function () {
      const receiver = testUsers[6];

      await expect(
        staking.rescueNFT(ethers.constants.AddressZero, receiver.address, 1)
      ).to.be.revertedWithCustomError(staking, "InvalidAddress");

      await expect(
        staking.rescueNFT(staking.address, receiver.address, 1)
      ).to.be.revertedWithCustomError(staking, "InvalidAddress");
    });

    it("should revert rescueNFT for Pixelmon token", async function () {
      const receiver = testUsers[6];

      await expect(
        staking.rescueNFT(pixelmon.address, receiver.address, 1)
      ).to.be.revertedWithCustomError(staking, "InvalidAddress");
    });

    it("should revert rescueNFT for invalid token receiver", async function () {
      await expect(
        staking.rescueNFT(
          pixelmonTrainer.address,
          ethers.constants.AddressZero,
          1
        )
      ).to.be.revertedWithCustomError(staking, "InvalidAddress");

      await expect(
        staking.rescueNFT(pixelmonTrainer.address, staking.address, 1)
      ).to.be.revertedWithCustomError(staking, "InvalidAddress");
    });

    
    
    
    it("should enable/disable emergencyMode and pause contract", async function () {
      const owner = testUsers[0].address;

      expect(await staking.toggleEmergencyMode(true))
        .to.emit(staking, "Pause")
        .withArgs(owner)
        .and.to.emit(staking, "ToggleEmergencyMode")
        .withArgs(true);

      expect(await staking.paused()).to.be.true;
      expect(await staking.emergencyMode()).to.be.true;

      expect(await staking.toggleEmergencyMode(false))
        .to.emit(staking, "ToggleEmergencyMode")
        .withArgs(false);

      expect(await staking.paused()).to.be.true;
      expect(await staking.emergencyMode()).to.be.false;

      await staking.unpause();
    });

    it("should revert direct transfer to contract using safeTransferFrom", async function () {
      const user = testUsers[5];

      const tokenId = await mintPixelmons(1, user.address);

      await expect(
        pixelmon
          .connect(user)
          ["safeTransferFrom(address,address,uint256)"](
            user.address,
            staking.address,
            tokenId[0]
          )
      ).to.be.revertedWith(
        "ERC721: transfer to non ERC721Receiver implementer"
      );
    });

    it("should revert stake when paused", async function () {
      const user = testUsers[2];

      await staking.pause();

      await expect(
        staking.connect(user).stake(["1"], randomSignature)
      ).to.be.revertedWithCustomError(staking, "Paused");

      await staking.unpause();
    });

    it("should revert stake with empty tokens array", async function () {
      const user = testUsers[2];

      await expect(
        staking.connect(user).stake([], randomSignature)
      ).to.be.revertedWithCustomError(staking, "InvalidInputArrayLength");
    });

    it("should revert stake with more than 25 tokens", async function () {
      const user = testUsers[2];

      const tokenIds = await mintPixelmons(
        tokensPerOperationLimit + 1,
        user.address
      );

      await expect(staking.stake(tokenIds, randomSignature)).to.be.revertedWithCustomError(
        staking,
        "InvalidInputArrayLength"
      );
    });

    it("should revert stake if staking contract wasnt approved", async function () {
      const user = testUsers[3];

      const stakeTokenIds = await mintPixelmons(1, user.address);

      const signature = await createSignature(stakeTokenIds, user.address, staking, testUsers[0]);

      await expect(
        staking.connect(user).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("should revert stake for token not owned by caller", async function () {
      const tokenOwner = testUsers[3];
      const stakeCaller = testUsers[4];

      const stakeTokenIds = await mintPixelmons(1, tokenOwner.address);
      const signature = await createSignature(stakeTokenIds, stakeCaller.address, staking, testUsers[0]);


      await expect(
        staking.connect(stakeCaller).stake(stakeTokenIds, signature)
      ).to.be.revertedWithCustomError(staking, "NotAnOwner");
    });

    it("should revert stake Invalid Signature", async function () {
      const tokenOwner = testUsers[3];
      const stakeCaller = testUsers[4];

      const stakeTokenIds = await mintPixelmons(1, tokenOwner.address);
      let signature = await createSignature([1,2,3,4], stakeCaller.address, staking, testUsers[0]);

      await expect(
        staking.connect(stakeCaller).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");

      signature = await createSignature(stakeTokenIds, tokenOwner.address, staking, testUsers[0]);

      await expect(
        staking.connect(stakeCaller).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");
    });

    it("should revert stake Invalid Signature with different domain and version", async function () {
      const tokenOwner = testUsers[3];

      const stakeTokenIds = await mintPixelmons(1, tokenOwner.address);
      let signature = await createInvalidSignature(stakeTokenIds, tokenOwner.address, staking, testUsers[0], "InvalidDomain", "1");

      await expect(
        staking.connect(tokenOwner).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");

      signature = await createInvalidSignature(stakeTokenIds, tokenOwner.address, staking, testUsers[0], "Pixelmon-Staking", "2");

      await expect(
        staking.connect(tokenOwner).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");
    });

    it("should revert stake Invalid Signature form invalid signer", async function () {
      const tokenOwner = testUsers[3];

      const stakeTokenIds = await mintPixelmons(1, tokenOwner.address);
      let signature = await createSignature(stakeTokenIds, tokenOwner.address, staking, testUsers[1]);

      await expect(
        staking.connect(tokenOwner).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");
    });

    it("should revert stake Invalid Signature from different domain", async function () {
      const tokenOwner = testUsers[3];
      const stakeCaller = testUsers[4];

      const stakeTokenIds = await mintPixelmons(1, tokenOwner.address);
      let signature = await createSignature([1,2,3,4], stakeCaller.address, staking, testUsers[0]);

      await expect(
        staking.connect(stakeCaller).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");

      signature = await createSignature(stakeTokenIds, tokenOwner.address, staking, testUsers[0]);

      await expect(
        staking.connect(stakeCaller).stake(stakeTokenIds, signature)
      ).to.be.revertedWith("Signature invalid or unauthorized");
    });

    it("should revert stake if tokens was already staked", async function () {
      const user = testUsers[8];
      const lockPerid = await staking.LOCK_PERIOD();

      const stakeTokenIds = await mintPixelmons(1, user.address);

      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      const signature = await createSignature(stakeTokenIds, user.address, staking, testUsers[0]);
      await staking.connect(user).stake(stakeTokenIds, signature);

      expect(await pixelmon.ownerOf(stakeTokenIds[0])).to.equal(
        staking.address
      );

      const currentTimestamp = await time.latest();
      const newTimestamp = currentTimestamp + lockPerid.toNumber();

      await time.increaseTo(newTimestamp);
      await mine(1);

      expect(await staking.connect(user).unstake(stakeTokenIds));

      expect(await pixelmon.ownerOf(stakeTokenIds[0])).to.equal(user.address);

      await expect(
        staking.connect(user).stake(stakeTokenIds, signature)
      ).to.be.revertedWithCustomError(staking, "TokenWasStaked");
    });

    it("should stake 25 tokens and transfer 25 reward tokens", async function () {
      const user = testUsers[2];
      const currentRewardTokenId = await staking.rangeOneCurrentTokenId();

      const stakeTokenIds = await mintPixelmons(
        tokensPerOperationLimit,
        user.address
      );

      const signature = await createSignature(stakeTokenIds, user.address, staking, testUsers[0]);
      const owner = await staking.owner();
      const signer = await staking.verifyStakingSignature(stakeTokenIds, user.address, signature);
      expect(signer).to.equal(owner);
      await pixelmon.connect(user).setApprovalForAll(staking.address, true);

      const expectedRewardsTokens = Array.from(
        { length: tokensPerOperationLimit },
        (v, k) => k + currentRewardTokenId
      );

      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      const stakeTxn = await staking.connect(user).stake(stakeTokenIds, signature);

      await checkStakeEvents(
        stakeTxn,
        user.address,
        stakeTokenIds,
        expectedRewardsTokens
      );

      for (const tokenId of stakeTokenIds) {
        expect(await pixelmon.ownerOf(tokenId)).to.equal(staking.address);
      }

      for (const tokenId of expectedRewardsTokens) {
        expect(await pixelmonTrainer.ownerOf(tokenId)).to.equal(user.address);
      }
    });

    it("Only contract will be able to update signer address", async function () {

      const user = testUsers[2];
      const currentRewardTokenId = await staking.rangeOneCurrentTokenId();
      const newSigner = testUsers[5];

      const stakeTokenIds = await mintPixelmons(
        tokensPerOperationLimit,
        user.address
      );

      await expect(
        staking.connect(user).setSigner(newSigner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await staking.connect(testUsers[0]).setSigner(newSigner.address);

      const signature = await createSignature(stakeTokenIds, user.address, staking, newSigner);
      const signer = await staking.verifyStakingSignature(stakeTokenIds, user.address, signature);
      expect(signer).to.equal(newSigner.address);
      await pixelmon.connect(user).setApprovalForAll(staking.address, true);

      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      await staking.connect(user).stake(stakeTokenIds, signature);
      
    });

    it("should revert unstake when paused", async function () {
      const user = testUsers[2];

      await staking.pause();

      await expect(
        staking.connect(user).unstake(["1"])
      ).to.be.revertedWithCustomError(staking, "Paused");

      await staking.unpause();
    });

    it("should revert unstake with empty tokens array", async function () {
      const user = testUsers[2];

      await expect(
        staking.connect(user).unstake([])
      ).to.be.revertedWithCustomError(staking, "InvalidInputArrayLength");
    });

    it("should revert unstake with more than 25 tokens", async function () {
      const user = testUsers[2];

      const tokenIds = await mintPixelmons(
        tokensPerOperationLimit + 1,
        user.address
      );

      await expect(
        staking.connect(user).unstake(tokenIds)
      ).to.be.revertedWithCustomError(staking, "InvalidInputArrayLength");
    });

    it("should revert unstake not for stake owner", async function () {
      const stakeOwner = testUsers[7];
      const unstakeCaller = testUsers[8];

      const tokenIds = await mintPixelmons(1, stakeOwner.address);
      await pixelmon
        .connect(stakeOwner)
        .setApprovalForAll(staking.address, true);

      const signature = await createSignature(tokenIds, stakeOwner.address, staking, testUsers[0]);

      expect(await staking.connect(stakeOwner).stake(tokenIds, signature));

      await expect(
        staking.connect(unstakeCaller).unstake(tokenIds)
      ).to.be.revertedWithCustomError(staking, "NotAnOwner");
    });

    it("should revert unstake when lock period not passed", async function () {
      const user = testUsers[7];

      const tokenIds = await mintPixelmons(1, user.address);
      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      const signature = await createSignature(tokenIds, user.address, staking, testUsers[0]);

      expect(await staking.connect(user).stake(tokenIds, signature));

      await expect(
        staking.connect(user).unstake(tokenIds)
      ).to.be.revertedWithCustomError(staking, "TokenLocked");
    });

    it("should unstake tokens after lock period passed", async function () {
      const user = testUsers[7];
      const lockPerid = await staking.LOCK_PERIOD();

      const stakeTokenIds = await mintPixelmons(
        tokensPerOperationLimit,
        user.address
      );

      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      const signature = await createSignature(stakeTokenIds, user.address, staking, testUsers[0]);
      await staking.connect(user).stake(stakeTokenIds, signature);

      for (const tokenId of stakeTokenIds) {
        expect(await pixelmon.ownerOf(tokenId)).to.equal(staking.address);
      }

      const currentTimestamp = await time.latest();
      const newTimestamp = currentTimestamp + lockPerid.toNumber();

      await time.increaseTo(newTimestamp);
      await mine(1);

      const unstakeTxn = await staking.connect(user).unstake(stakeTokenIds);

      await checkUnstakeEvents(unstakeTxn, user.address, stakeTokenIds);

      for (const tokenId of stakeTokenIds) {
        expect(await pixelmon.ownerOf(tokenId)).to.equal(user.address);
      }
    });

    
    it("should rescue PixelmonTrainer NFT token", async function () {
      const user = testUsers[5];
      const tokenId = await mintPixelmons(1, staking.address);

      await expect(
        staking.rescueNFT(pixelmonTrainer.address, user.address, tokenId[0])
      )
        .to.emit(staking, "TokenRescue")
        .withArgs(pixelmonTrainer.address, user.address, tokenId[0]);

      expect(await pixelmonTrainer.ownerOf(tokenId[0])).to.equal(user.address);
    });

    it("should revert calling emergencyUnstake not in emergency mode", async function () {
      await expect(
        staking.emergencyUnstake(["1"])
      ).to.be.revertedWithCustomError(staking, "NotAvailableInRegularMode");
    });

    it("should allow emergency unstake in emergency mode", async function () {
      const user = testUsers[3];

      const stakeTokenIds = await mintPixelmons(
        tokensPerOperationLimit,
        user.address
      );

      await pixelmon.connect(user).setApprovalForAll(staking.address, true);
      const signature = await createSignature(stakeTokenIds, user.address, staking, testUsers[0]);
      await staking.connect(user).stake(stakeTokenIds, signature);

      for (const tokenId of stakeTokenIds) {
        expect(await pixelmon.ownerOf(tokenId)).to.equal(staking.address);
      }

      await staking.toggleEmergencyMode(true);

      await staking.connect(user).emergencyUnstake(stakeTokenIds);

      for (const tokenId of stakeTokenIds) {
        expect(await pixelmon.ownerOf(tokenId)).to.equal(user.address);
      }
    });
  });
});

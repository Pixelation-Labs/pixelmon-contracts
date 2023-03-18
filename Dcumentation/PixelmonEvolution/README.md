![LiquidXLogo.png](./Images/LiquidXLogo.png)
# Pixelmon Evolution Smart Contract

## Authors: Atiq

## Reviewers: Nobel, Shajahan, Shafiul, Excel

## Created on: 7 Feb, 2023

## Last updated on: 7 Feb, 2023
## Last updated by: Atiq

# Overview
The Pixelmon NFT smart contract has token of different evolution stage. For the Evolution Stage 1, all 10,005 has been minted. The Pixelmon NFT smart contract also has a method named `mintEvolvedPixelmon`. This method is for minting the other Evolution Stages Pixelmon NFTs.

We have another smart contract named **Pixelmon Evolution Serum**. This is a ERC1155 token smart contract. 

The existing functionality between the Pixelmon NFT and Serum token is given below.

1. In Pixelmon NFT smart contract, we have the method named `mintEvolvedPixelmon`. Only the serum smart contract can call this method to mint the evolve pixelmon for user.
2. Serum smart contract, there is a `evolve` method for the user to get the evolve Pixelmon token.
3. The `evolve` method details:

**Input Details**
* `tokenId`: single pixelmon token ID
* `serumId`: single serum token ID
* `nonce`: the count of call from the user wallet
* `evolutionStage`: for which state the new pixelmon token will be minted
* `signature`: the signature from evolution signer with the information discussed above

**Statement Flow**
* Validate the nonce value for the user. And increment the nonce value for the user.
* Validate the user is the token owner of the provided token ID
* Validate whether the signature is correct or not
* Burn the serum tokenID for the caller. (the call of this method should be owner of the serum token ID provided in the input and it will be burn)
* Call the `mintEvolvedPixelmon` method in the Pixelmon NFT contract and mint a pixelmon token for the caller of the Evolve method

**Note** 
* The evolve does not take input as batch. We can not provide multiple token ID in an array for batch evolve method.

## Product document
* [Evolution 2 Pixelmon](https://docs.google.com/document/d/1BYKGpqr2Hoa5VYHa3Ri4rGI7N6N-_2fj4fzblb5z36Y/edit?usp=sharing)
* [Evolution with hard staking](https://docs.google.com/document/d/1VsyHtsgHSxEljc-UfKdUyCZwY4ToL-EK5FSodybV6xI/edit?usp=sharing)

# Proposed solution
To Resolve the issue of batch evolve pixelmon NFT. We are creating the new Pixelmon Evolution Smart Contract. 

**The Functionality of Pixelmon Evolution Smart Contract**
1. It will have a `evolvePixelmon` method. This method will take the Pixelmon and Serum Token information in batch.
2. It will be able to validate the pixelmon, serum token, token owner information, nonce, staking time period with the signature.
3. Then it will transfer the serum token to the burner address `0x000000000000000000000000000000000000dEaD`.
4. Then it will call the `mintEvolvedPixelmon` method in the pixelmon NFT smart contract.
5. the new evolved pixelmon will be minted and transferred to the `PixelmonEvolution` (this new) smart contract. And it's information (by whom and when it can be claimed) will be saved in the smart contract.
6. The Pixelmon NFT that has been used for evolution will also be staked in this `PixelmonEvolution` (this new) smart contract for 30 day time period.
7. User will be able to claim the E1 and E2 Pixelmon after the staking time lock period.
8. We will keep a time lock flag. if the flag is not active then user will be able to claim it any time. This flag will be updatable by the contract owner. 
5. The contract owner will be able to set the signer wallet address.
6. The contract will be able to set the pixelmon contract address and the serum token address.


### Usecase Diagram
![Use Case Diagram](./Images/Use%20case%20diagram.drawio2.png "Use Case Diagram")

### Activity Diagram for `evolvePixelmon` Method
![Activity Diagram](./Images/Activity%20Diagramdrawio.drawio2.png "Activity Diagram")

### Sequence Diagram
![Sequence Diagram](./Images/Sequese%20Diagram.drawio2.png "Sequence Diagram")

# Test plan
## Test Cases
```
  Pixelmon Evolution Contract Functionality
    ✔ Contract should be deployed 
    ✔ recoverSignerFromSignature will recover signer wallet from signature
    ✔ recoverSignerFromSignature will not recover signer wallet from signature for invalid data
    ✔ Only contract owner will be able to setPixelmonAddress
    ✔ Only contract owner will be able to setNextEvolvePixelmonId 
    ✔ Only contract owner will be able to setSerumAddress
    ✔ Only contract owner will be able to setSignerAddress
    ✔ evolvePixelmon will revert if serumIds and amounts length is not same 
    ✔ evolvePixelmon will revert if serum amount and pixelmon token amount is not same 
    ✔ evolvePixelmon will revert if wallet nonce is not matched
    ✔ evolvePixelmon will revert if wallet for invalid signature 
    ✔ evolvePixelmon will revert contract is not set approved for all 
    ✔ evolvePixelmon will revert user does not have proper serum balance 
    ✔ evolvePixelmon will revert user is not owner of the pixelmon NFT 
    ✔ evolvePixelmon will successful for valid data and pixelmon and serum owner 
    ✔ user will be able to claim after the time lock period
    ✔ user will be able to claim instantly if time lock is not active 
    ✔ user will not be able to claim before the time lock period 
    ✔ Attack test from attacker contract

```
## Unit test
File                    |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------|----------|----------|----------|----------|----------------|
 contracts/             |      100 |    94.44 |      100 |      100 |                |
  IPixelmon.sol         |      100 |      100 |      100 |      100 |                |
  PixelmonEvolution.sol |      100 |    94.44 |      100 |      100 |                |
All files               |      100 |    94.44 |      100 |      100 |                |

# Deployment Steps
The purpose of this section is to explain the steps for deploying the Pixelmon Evolution smart contract and configuring it for using in the application.

## Software Requirements
To deploy this smart contract in the Mainnet or in the Goerli test net the following tools need to be installed in the computer.

1. [Node js](https://nodejs.org/en/download/) >= v16.10.0. (16.10.0 Recommended)
2. [Git](https://git-scm.com/downloads) >= v2.37.3

## Cost Supply Requirements
1. The private key of a wallet address that has enough ethers for deploying claim gift smart contracts.
2. Estimated cost: [Estimated Cost for Smart Contract](https://docs.google.com/spreadsheets/d/1H0VSCUvdccVWhFKvhpKM4cyH700vjN-mx2fSKlq8oKg/edit#gid=709143748)

## Smart Contract Deployment Steps
1. Download the smart contract from [git repository](https://github.com/Pixelation-Labs/pixelmon-contracts).  
2. Go to the repository with the command
``` 
cd Pixelmon-evolution-smart-contract
```

3. Copy the example.env file and create the .env file with the following information
```
PRIVATE_KEY=<Deployer wallet private key>
NETWORK=<goerli/mainnet>
PIXELMON_CONTRACT=<pixelmon contract address>
SERUM_CONTRACT=<serum contract address>
SIGNER_WALLET=<signer wallet address>
```

4. Install required packages 
```
yarn install 
```

5. Compile code 
```
yarn compile
```

6. Deploy smart contract. 
```
yarn deploy:pixelmon:evolution:contract:mainnet
```
For goerli it will be 
```
yarn deploy:pixelmon:evolution:contract:goerli
```

7. To test the smart contract use this command
```
test:pixelmon:evolution
```

8. Publish Smart contract
```
yarn publish:contract:mainnet <NEW_CONTRACT_ADDRESS> <PIXELMON_CONTRACT> <SERUM_CONTRACT> <SIGNER_WALLET>
```
For goerli it will be 
```
yarn publish:contract:goerli <NEW_CONTRACT_ADDRESS> <PIXELMON_CONTRACT> <SERUM_CONTRACT> <SIGNER_WALLET>
```

9. Set the new deployed contract in the pixelmon contract as serum contract

10. In serum contract for user wallet set approve for all for the new evolution contract

11. call the `evolvePixelmon` contract from user wallet

**Signature Code**
```nodejs
    async function createSignature(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, stakedFor, tokenOwner, contract, signer) {
        const hashPixelmonTokenIds = await contract.getHashIntFromArray(pixelmonTokenIds);
        const hashSerumIds = await contract.getHashIntFromArray(serumIds);
        const hashAmounts = await contract.getHashIntFromArray(amounts);

        const signatureObject = {
            pixelmonTokenIds: hashPixelmonTokenIds,
            serumIds: hashSerumIds,
            serumAmounts: hashAmounts,
            evolutionStage,
            nonce,
            stakedFor,
            tokenOwner,
        };

        const chainId = 31337;
        const SIGNING_DOMAIN_NAME = "Pixelmon-Evolution";
        const SIGNING_DOMAIN_VERSION = "1";
        const types = {
            PixelmonEvolutionSignature: [
                { name: "pixelmonTokenIds", type: "uint256" },
                { name: "serumIds", type: "uint256" },
                { name: "serumAmounts", type: "uint256" },
                { name: "evolutionStage", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "stakedFor", type: "uint256" },
                { name: "tokenOwner", type: "address" },
            ],
        };
        const domain = {
            name: SIGNING_DOMAIN_NAME,
            version: SIGNING_DOMAIN_VERSION,
            verifyingContract: contract.address,
            chainId,
        };

        const signature = await signer._signTypedData(domain, types, signatureObject);
        return signature;
    }

```
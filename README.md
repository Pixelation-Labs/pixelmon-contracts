# pixelmon-contracts
Pixelmon contracts

## Audit Report
    1. [Pixelmon Trainer](https://github.com/Pixelation-Labs/pixelmon-contracts/blob/initial-setup/AuditReport/Pixelmon%20Trainer%20Smart%20Contract%20Audit%20by%20Solidity%20Finance.pdf)
    2. [Pixelmon Staking](https://github.com/Pixelation-Labs/pixelmon-contracts/blob/initial-setup/AuditReport/Pixelmon%20Staking%20Smart%20Contract%20Audit%20by%20Solidity%20Finance.pdf)
    3. [Trainer Adventure + Trainer Gear + Sponsored Trips](https://github.com/Pixelation-Labs/pixelmon-contracts/blob/initial-setup/AuditReport/PixelmonTrainer_audit_report.pdf)

# About
This project contains all the smart contract of Pixelmon. It contains several pixelmon token collections, Staking and adventure busines smart contract. Smart contract it contains are:
 - Pixelmon NFT
 - Pixelmon Staking
 - Pixelmon Trainer
 - Pixelmon Trainer Adventure
 - Pixelmon Serum
 - Pixelmon Trips
 - Pixelmon Trainer Gear

## mainnet SC link
1. Pixelmon Smart Contract:	https://etherscan.io/address/0x32973908faee0bf825a343000fe412ebe56f802a
2. Pixelmon Staking Smart Contract: 	https://etherscan.io/address/0x217b53f8a059a5768aef26034b4a4ed2018d70f2
3. Serum Smart Contract:	https://etherscan.io/address/0xadae0ddaf90170a44adebcfb8eede12041d13220
4. Pixelmon Trainer Smart Contract:	https://etherscan.io/address/0x8A3749936E723325C6b645a0901470cD9E790B94
5. Trainer Adventure:	https://etherscan.io/address/0xb758310c8a396b9608a587B6D6977A505fF27B17
6. Trainer Gear: 	https://etherscan.io/address/0x05A6528663278f51f9cc22D0bb3ca0E1e0a3Ae2f
7. Sponsored Trips:	https://etherscan.io/address/0xd6345673f53426db467f9376e4545d8d36f6aae8

## Software Requirements
To deploy this smart contract in the Mainnet or in the Goerli test net the following tools need to be installed in the computer.

1. Node js >= v16.10.0. (16.10.0 Recommended)
2. Git >= v2.37.3

## Smart Contract Deployment Steps
1. Download the smart contract from git repository. https://github.com/Pixelation-Labs/pixelmon-contracts
2. Go to the repository with the command 
```
cd pixelmon-contracts
```

3. Copy the example.env file and create the .env file with the following information
```
PRIVATE_KEY=<Deployer wallet private key>
NETWORK=<goerli/mainnet>
```

4. Install required packages
```
yarn install 
```

5. Compile code 
```
yarn compile
```

6. Run unit test
```
yarn test:coverage
```

## Px Trainer Adventure Deployment steps

1. Download this repository from github.
2. Install required packages
```
yarn install 
```
3. Compile code 
```
yarn compile
```
4. To run unit test update the `generateChainLinkRandomNumbers` method in `PxChainlinkManager.sol` with the following code.
```solidity
    uint256 reqId;
    /// @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    /// @return requestId Chainlink requestId
    function generateChainLinkRandomNumbers(
        uint256 _weekNumber
    ) external  returns (uint256 requestId) {

        if (msg.sender != trainerAdventureContractAddress) {
            revert NotAllowedToCall();
        }
        
        requests[reqId] = Request({randomWords: new uint256[](0), exists: true, fulfilled: false, weekNumber: _weekNumber});
        requestId = COORDINATOR.requestRandomWords(keyHash, chainLinkSubscriptionId, requestConfirmations, callbackGasLimit, Random_Number_Count);
        requestIds.push(requestId);
        lastRequestId = requestId;
        return requestId;
    }
```
We need to do it because, chainlink does not have any functionality to test in hardhat now. We created a mock smart contract and using it. It is creating the similar scenario as chainlink randomization.
**After completing the unit test do not forget to revert the change before deployment.**

5. Setup the .env file.
```shell
PRIVATE_KEY=<deployer wallet private key>
NETWORK=<goerli/mainnet>
SIGNER=<signer wallet address>
VRF_COORDINATOR=<chainlink VRF coordinator smart contract address>
SUBSCRIPTION_ID=<chainlink subscription id>
KEY_HASH=<chainlink key hash>

```

6. Deploy the `PxChainlinkManager.sol` with the following command.
```shell
yarn deploy:PxChainlinkManagerContract:mainnet
```

7. Publish the `PxChainlinkManager.sol` with the following command.
```shell
yarn publish:contract:mainnet <NEW_CONTRACT_ADDRESS> <SIGNER> <VRF_COORDINATOR> <SUBSCRIPTION_ID> <KEY_HASH>
```

8. Setup the `.env` file for `PxTrainerAdventure.sol`. Add new environment property
```shell
PX_CHAINLINK_MANAGER_CONTRACT_ADDRESS=<The contract address of chainlink manager>
```

9. Publish the `PxTrainerAdventure.sol` with the following command.
```shell
yarn publish:contract:mainnet <NEW_CONTRACT_ADDRESS> <PX_CHAINLINK_MANAGER_CONTRACT_ADDRESS>
```

10. Set the PxTrainerAdventure contract address in the PxChainlinkManager smart contract with `setSignerAddress` this method by the contract owner wallet.
11. Add PxChainlinkManager as a consumer in the chainlink subscription.
12. Add Admin wallet in the Trainer Adventure contract
13. Add Moderator wallet in the Trainer Adventure contract
14. Add Vault wallet in the Trainer Adventure contract
15. Add treasure in the Trainer Adventure contract
16. Set approve for all from the vault wallet in all the treasure contract for the trainer adventure contract
17. Set the transfer permission for the trainer gear for the trainer adventure contract
18. Set up the weeks
19. Continue with the weekly draw process
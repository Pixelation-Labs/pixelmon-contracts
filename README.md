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


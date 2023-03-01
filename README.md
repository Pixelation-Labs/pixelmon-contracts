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

6. Run unit test without coverage
```
yarn test
```


6. Run unit test with coverage
```
yarn test:coverage
```



# Prototype Token(Coin) 
This is a prototype smart contract for implementing coin. The ERC20 token standard has been used to implement this smart contract which is the most used token standrad for most of the well known coin in Ethereum network.

## About ERC20 Token
ERC-20 is the technical standard for fungible tokens created using the Ethereum blockchain. ERC20 token contract keeps track of fungible tokens: any one token is exactly equal to any other token; no tokens have special rights or behavior associated with them. This makes ERC20 tokens useful for things like a medium of exchange currency, voting rights, staking, and more. there are more than 400,000 tokens on Ethereum with some very well known such as:
1. Tether (USDT)
2. USD coin (USDC)
3. Basic Attention Token (BAT)
4. Uniswap (UNI) 
5. Decentraland (MANA)
6. ApeCoin (APE)
7. Aave (AAVE)
8. Wrapped Bitcoin (WBTC)  
9. Chain Link Token (LINK)

ERC20 token does not have any token ID. In one Smart contract, there exist only one token type. And user have the balance. For example:
- Wallet 1 has balance of Prototype = 100
- Wallet 2 has balance of Prototype = 30.7 
- Wallet 3 has balance of Prototype = 79.5 
- Total Supply = 210.2
**Note: The Smart contract only maintain the record of total supply and the amount of individual holders** 

## A Note on decimals
Let's assume we have a ERC20 token named "GLD". Often, we’ll want to be able to divide our tokens into arbitrary amounts: say, if we own 5 GLD, we may want to send 1.5 GLD to a friend, and keep 3.5 GLD to ourselves. 
Unfortunately, Solidity and the EVM do not support this behavior: only integer (whole) numbers can be used, which poses an issue. You may send 1 or 2 tokens, but not 1.5.

**To work around this, ERC20 provides a decimals field, which is used to specify how many decimal places a token has. To be able to transfer 1.5 GLD, decimals must be at least 1, since that number has a single decimal place.**
### How can this be achieved? 
It’s actually very simple: a token contract can use larger integer values, so that a balance of 50 will represent 5 GLD, a transfer of 15 will correspond to 1.5 GLD being sent, and so on.
It is important to understand that decimals is only used for display purposes. All arithmetic inside the contract is still performed on integers, and it is the different user interfaces (wallets, exchanges, etc.) that must adjust the displayed values according to decimals. The total token supply and balance of each account are not specified in GLD: you need to divide by 10 ** decimals to get the actual GLD amount.
We’ll probably want to use a decimals value of 18, just like Ether and most ERC20 token contracts in use, unless you have a very special reason not to. When minting tokens or transferring them around, you will be actually sending the number num GLD * (10 ** decimals).

## Basic ERC20 Token Methods
### name
Returns the `name` of the token - e.g. "PrototypeToken".

OPTIONAL - This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.

```solidity
function name() public view returns (string);
```

### symbol
Returns the `symbol` of the token. E.g. “PRT”.

OPTIONAL - This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.
```solidity
function symbol() public view returns (string);
```

### decimals
Returns the number of `decimals` the token uses - e.g. `18`, means to divide the token amount by `1000000000000000000` to get its user representation.

OPTIONAL - This method can be used to improve usability, but interfaces and other contracts MUST NOT expect these values to be present.
```solidity
function decimals() public view returns (uint18);
```
totalSupply
Returns the total token supply.

function totalSupply() public view returns (uint256)
balanceOf
Returns the account balance of another account with address _owner.

function balanceOf(address _owner) public view returns (uint256 balance)
transfer
Transfers _value amount of tokens to address _to, and MUST fire the Transfer event. The function SHOULD throw if the message caller’s account balance does not have enough tokens to spend.

Note Transfers of 0 values MUST be treated as normal transfers and fire the Transfer event.

function transfer(address _to, uint256 _value) public returns (bool success)
transferFrom
Transfers _value amount of tokens from address _from to address _to, and MUST fire the Transfer event.

The transferFrom method is used for a withdraw workflow, allowing contracts to transfer tokens on your behalf. This can be used for example to allow a contract to transfer tokens on your behalf and/or to charge fees in sub-currencies. The function SHOULD throw unless the _from account has deliberately authorized the sender of the message via some mechanism.

Note Transfers of 0 values MUST be treated as normal transfers and fire the Transfer event.

function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
approve
Allows _spender to withdraw from your account multiple times, up to the _value amount. If this function is called again it overwrites the current allowance with _value.

NOTE: To prevent attack vectors like the one described here and discussed here, clients SHOULD make sure to create user interfaces in such a way that they set the allowance first to 0 before setting it to another value for the same spender. THOUGH The contract itself shouldn’t enforce it, to allow backwards compatibility with contracts deployed before

function approve(address _spender, uint256 _value) public returns (bool success)
allowance
Returns the amount which _spender is still allowed to withdraw from _owner.

function allowance(address _owner, address _spender) public view returns (uint256 remaining)
Events
Transfer
MUST trigger when tokens are transferred, including zero value transfers.

A token contract which creates new tokens SHOULD trigger a Transfer event with the _from address set to 0x0 when tokens are created.

event Transfer(address indexed _from, address indexed _to, uint256 _value)
Approval
MUST trigger on any successful call to approve(address _spender, uint256 _value).

event Approval(address indexed _owner, address indexed _spender, uint256 _value)


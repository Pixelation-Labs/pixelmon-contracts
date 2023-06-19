# Step to run Script for Update Weekly Treasure Distribution

1. Install Node 16.10.0
2. Install Yarn
3. Install Git
4. Download this repository
5. Install pacakages with `yarn install`
6. Set the following Example ENV
```
PRIVATE_KEY=<Private Key without 0x in the beginning>
NETWORK=mainnet
PX_PARTY_SQUAD_CONTRACT=<mainnet sc>
WEEK_NUMBER=<current week number>
TREASURE_INDEX=[1]
TREASURE_COUNTS=[10]
SPECIAL_TREASURE_AMOUNT=0
```
7. Compile code with `yarn compile`
8. Run `set:treasure:distribution:mainnet`
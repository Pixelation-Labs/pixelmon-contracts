const hre = require("hardhat");
require("dotenv").config();

async function main() {

    const contractAddress = process.env.PX_PARTY_SQUAD_CONTRACT;
    const PxPartySquad = await hre.ethers.getContractFactory("PxPartySquad");
    const pxPartySquad = await PxPartySquad.attach(contractAddress);

    const week = Number(process.env.WEEK_NUMBER);
    const treasureIndex = JSON.parse(process.env.TREASURE_INDEX);
    const treasureCount =  JSON.parse(process.env.TREASURE_COUNTS);
    const specialTreasureAmount = Number(process.env.SPECIAL_TREASURE_AMOUNT);

    console.log(`week: ${week}`);
    console.log(`treasureIndex:`);
    console.log(treasureIndex);
    console.log(`treasureCount:`);
    console.log(treasureCount);
    console.log(`specialTreasureAmount: ${specialTreasureAmount}`);

    let transaction = await pxPartySquad.setWeeklyTreasureDistribution(
        week,
        treasureIndex,
        treasureCount,
        specialTreasureAmount
    );

    console.log("transaction: ");
    console.log(transaction);
    console.log("Complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
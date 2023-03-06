import hre from "hardhat";
import constructorArgs from "./arguments";

const contractAddress = "0x0000000000000000000000000000000000000000";

async function verify() {
  console.log("Verifying contract at address: ", contractAddress);
  console.log("Contract constructor args: ", constructorArgs);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

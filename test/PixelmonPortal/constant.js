const {ethers} = require("hardhat");

module.exports = {
  baseURI: "https://metadata.pixelmon.ai/api/token/",
  contractName: "PixelmonSponsoredTrips",
  tokenSupply: 60,
  tokenId: 1,
  EventMint: "Mint",
  ErrorNotOwner: "Ownable: caller is not the owner",
  ErrorNotMinter: "NotMinter",
  ErrorInvalidAddress: "InvalidAddress",
  ErrorMintingIsDisabled: "MintingIsDisabled",
  ErrorBurningIsDisabled: "BurningIsDisabled",
  ErrorMintMoreThanSupply: "Can't mint more than total supply",
  ErrorMintZero: "Can't mint 0 token",
  ErrorBurnExceedBalance: "ERC1155: burn amount exceeds balance",
  ErrorSupplyLessThanMintedToken: "Supply can't be less than amount of minted token"
}

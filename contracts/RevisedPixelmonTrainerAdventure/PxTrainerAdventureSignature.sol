// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PxTrainerAdventureSignature is EIP712, Ownable {
    /// @dev Signing domain for the purpose of creating signature
    string public constant SIGNING_DOMAIN = "Pixelmon-Trainer-Adventure";
    /// @dev signature version for creating and verifying signature
    string public constant SIGNATURE_VERSION = "1";

    /// @notice The contract constructor
    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {}

    /// @notice Recovers signer wallet from signature
    /// @dev View function for signature recovering
    /// @param weekNumber Week number for claim
    /// @param claimIndex Claim index for a perticular user for a week
    /// @param walletAddress Token owner wallet address
    /// @param signature Signature from signer wallet
    function recoverSignerFromSignature(
        uint256 weekNumber,
        uint256 claimIndex,
        address walletAddress,
        bytes calldata signature
    ) external view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("PxTrainerAdventureSignature(uint256 weekNumber,uint256 claimIndex,address walletAddress)"),
                    weekNumber,
                    claimIndex,
                    walletAddress
                )
            )
        );
        return ECDSA.recover(digest, signature);
    }
}

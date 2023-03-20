// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PxTrainerAdventureSignature is EIP712, Ownable {
    /// @dev Signing domain for the purpose of creating signature
    string public constant SIGNING_DOMAIN = "Pixelmon-Trainer-Adventure";
    /// @dev signature version for creating and verifying signature
    string public constant SIGNATURE_VERSION = "1";

    /// @dev Signer wallet address for signature verification
    address public SIGNER;


    /// @notice The contract constructor
    /// @param _signer Signer wallet address for signature verification
    constructor(address _signer) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        SIGNER = _signer;
    }

    /// @notice Sets Signer wallet address
    /// @dev This function can only be executed by the contract owner
    /// @param signer Signer wallet address for signature verifition
    function setSignerAddress(address signer) external onlyOwner {
        SIGNER = signer;
    }

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
    ) external view returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("TrainerAdventureSignature(uint256 weekNumber,uint256 claimIndex,address walletAddress)"),
                    weekNumber,
                    claimIndex,
                    walletAddress
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        
        if(signer == SIGNER) {
            return true;
        }

        return false;
    }
}

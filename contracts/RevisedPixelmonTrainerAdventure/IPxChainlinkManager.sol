// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPxChainlinkManager {
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
    ) external returns (bool);

    function generateChainLinkRandomNumbers(uint256 _weekNumber) external returns (uint256 requestId);

    function getWeeklyRandomNumbers(uint256 _weekNumber) external view returns (uint256[] memory randomNumbers);
}

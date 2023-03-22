// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC1155Receiver.sol";
import "../PxTrainerAdventure.sol";

    error RejectCall();

contract TrainerAdventureAttacker is IERC1155Receiver {

    PxTrainerAdventure mainContract;

    function attack(
        address contractAddress
    ) public {
        mainContract = PxTrainerAdventure(contractAddress);
        mainContract.claimTreasure(1, "");
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        revert RejectCall();
    }

    ///@dev onERC1155BatchReceived needs to implement for getting the accepting ERC-1155
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        revert RejectCall();
    }

    ///@dev supportsInterface needs to implement for getting the accepting ERC-1155
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == type(IERC1155Receiver).interfaceId || interfaceID == type(IERC721Receiver).interfaceId;
    }
}

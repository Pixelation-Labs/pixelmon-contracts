// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC1155Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../PixelmonEvolution.sol";

error DoNotReveiveNFT();

contract Attacker is IERC1155Receiver {

    PixelmonEvolution mainContract;

    function attack(
        address contractAddress, 
        uint256[] memory pixelmonTokenIds,
        uint256[] memory serumIds,
        uint256[] memory amounts,
        bytes calldata signature
    ) public {
        mainContract = PixelmonEvolution(contractAddress);
        mainContract.evolvePixelmon(pixelmonTokenIds, serumIds, amounts, 2, 0, 0, signature);
    }

    ///@dev onERC1155Received needs to implement for getting the accepting ERC-1155
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        revert DoNotReveiveNFT(); 
        // return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    ///@dev onERC1155BatchReceived needs to implement for getting the accepting ERC-1155
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        
        return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }

    ///@dev supportsInterface needs to implement for getting the accepting ERC-1155
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return interfaceID == type(IERC1155Receiver).interfaceId || interfaceID == type(IERC721Receiver).interfaceId;
    }
}

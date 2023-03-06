// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "./IERC1155Receiver.sol";

contract Utils is IERC721Receiver, IERC1155Receiver {
    /// @notice Prevent overriding method and call from another contract
    modifier noContracts() {
        uint256 size;
        address acc = msg.sender;
        assembly {
            size := extcodesize(acc)
        }
        require(msg.sender == tx.origin, "tx.origin != msg.sender");
        require(size == 0, "Contract calls are not allowed");
        _;
    }

    /// @notice Increment by 1
    /// @param value Any valid uint256
    /// @return value + 1
    function _uncheckedInc(uint256 value) internal pure returns (uint256) {
        unchecked {
            return value + 1;
        }
    }

    function IsdataExistsInArray(uint256[] memory array, uint256 element) internal pure returns (bool) {
        for (uint256 index = 0; index < array.length; index++) {
            if (element == array[index]) return true;
        }

        return false;
    }

    /// @notice Generate random number
    /// @return A random number
    function getRandomNumber() internal view returns (uint256) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp +
                        block.difficulty +
                        ((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
                        block.gaslimit +
                        ((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
                        block.number
                )
            )
        );

        return randomNumber;
    }

    ///@dev onERC1155Received needs to implement for getting the accepting ERC-1155
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
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

    ///@dev onERC721Received needs to implement for getting the accepting ERC-721
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

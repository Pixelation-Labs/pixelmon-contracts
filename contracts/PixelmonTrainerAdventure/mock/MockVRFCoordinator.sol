//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract MockVRFCoordinator {
    uint256 internal counter = 0;
    uint256 internal randomCounter = 0;

    function getRandomNumber() internal view returns (uint256) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp +
                        block.difficulty +
                        ((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
                        block.gaslimit +
                        ((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
                        block.number + randomCounter
                )
            )
        );

        return randomNumber;
    }

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32 callbackGasLimit,
        uint32 totalRandomNumber
    ) external returns (uint256 requestId) {
        VRFConsumerBaseV2 consumer = VRFConsumerBaseV2(msg.sender);
        uint256[] memory randomWords = new uint256[](totalRandomNumber);

        for(uint256 i = 0; i < totalRandomNumber; i++) {
            randomWords[i] = getRandomNumber();
            randomCounter++;
        }

        uint256 previousCounter = counter;
        counter += 1;

        if(callbackGasLimit == 300) {
            consumer.rawFulfillRandomWords(300, randomWords);
        }
        else {
            consumer.rawFulfillRandomWords(previousCounter, randomWords);
        }
        
    }
}
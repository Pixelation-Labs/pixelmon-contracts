function getRandomNumber(uint nonce) internal view returns (uint256) {
	uint256 randomNumber = uint256(
		keccak256(
			abi.encodePacked(
				block.timestamp +
					block.difficulty +
					((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
					block.gaslimit +
					((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
					block.number + nonce
			)
		)
	);

	return randomNumber;
}
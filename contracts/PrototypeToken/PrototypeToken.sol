// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrototypeToken is ERC20, ERC20Burnable, Pausable, Ownable {
    
    ///@notice maximum token supply = 1,000,000,000
    uint256 constant MAX_TOKEN_SUPPLY = 1 * 10 ** 27;

    constructor() ERC20("PrototypeToken", "PRT") {}

    ///@notice contract owner can pause any transfer
    function pause() public onlyOwner {
        _pause();
    }

    ///@notice contract owner can unpause any transfer
    function unpause() public onlyOwner {
        _unpause();
    }

    ///@notice contract owner can unpause any transfer
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_TOKEN_SUPPLY, "Can not mint more than maximum supply");
        _mint(to, amount);
    }

    ///@notice checks if currently unpause or not before transferring token
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}

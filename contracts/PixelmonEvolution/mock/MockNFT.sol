// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MockNFT2 is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    uint256 public e2Counter = 10005;

    string public baseURI = "https://pixelmon.club/api/";
    ///@dev This emits new baseURI for metadata is reset.
    event SetBaseURI(string _baseURI);

    constructor() ERC721("Pixelmon", "PX") {}
    
    function safeMint(address to) public  {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
    }

    function safeBatchMint(address to, uint256 amount) public  {
        for(uint256 i = 0; i < amount; i++) {
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            _safeMint(to, tokenId);
        } 
    }

    /// @dev Overrides same function from OpenZeppelin ERC721, used in tokenURI function.
    /// @return baseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function mintEvolvedPixelmon(address receiver, uint evolutionStage) external {
        uint256 tokenId = e2Counter;
        e2Counter++;
        _safeMint(receiver, tokenId);
    }
}
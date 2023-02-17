// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract MockNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string public baseURI = "https://api.nonfungiblecdn.com/gangsterallstar/metadata/";
    ///@dev This emits new baseURI for metadata is reset.
    event SetBaseURI(string _baseURI);

    constructor() ERC721("MuNFT", "MNFT") {}
    function safeMint(address to) public  {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
    }

    /// @notice The contract owner is responsible to confirm that `_baseTokenURI` is the base URI for token metadata and it provides metadata with format <_URI><tokenID>
    /// @dev Update the metadata URI to a new server or IPFS if needed.
    /// @param _baseTokenURI New metadata base URI.
    function setBaseURI(string memory _baseTokenURI) external {
        baseURI = _baseTokenURI;
        emit SetBaseURI(_baseTokenURI);
    }

    /// @dev Overrides same function from OpenZeppelin ERC721, used in tokenURI function.
    /// @return baseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
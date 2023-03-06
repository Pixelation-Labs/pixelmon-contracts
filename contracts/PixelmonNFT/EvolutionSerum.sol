// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.14;

import "./Pixelmon.sol";
import "./ERC721.sol";
import "./ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error InvalidNonce();
error InvalidOwner();
error InvalidEvolution();
error InvalidVoucher();
error NotEnoughEther();

contract EvolutionSerum is ERC1155, Ownable, ERC1155TokenReceiver {
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    event Evolution(uint indexed tokenId, uint evolutionStage);

    /*///////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    // TODO: Replace with real address once we are generating the mintlist
    address constant public evolutionSigner = 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf;
    // TODO: Replace with new Gnosis Safe Address
    address constant public gnosisSafeAddress = 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf;

    string constant public name = "Pixelmon Evolution Serum";
    string constant public symbol = "SERUM";

    /*///////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    Pixelmon pixelmonContract;

    mapping(uint => uint) public serumPrices;
    mapping(address => uint) public nonces;
    mapping(bytes32 => bool) public usedVouchers;

    string baseURI;

    /*///////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address pixelmonAddress, string memory _baseURI) {
        pixelmonContract = Pixelmon(pixelmonAddress);
        baseURI = _baseURI;
    }

    /*///////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier correctNonce(uint nonce) {
        if(nonce != nonces[msg.sender]) revert InvalidNonce();
        nonces[msg.sender]++;
        _;
    }

    /*///////////////////////////////////////////////////////////////
                            METADATA LOGIC
    //////////////////////////////////////////////////////////////*/

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    function setSerumPrice(uint serumId, uint price) public onlyOwner {
        serumPrices[serumId] = price;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, id.toString()));
    }

    /*///////////////////////////////////////////////////////////////
                            MINTING LOGIC
    //////////////////////////////////////////////////////////////*/

    // function mintToTreasury(uint id, uint amount) public onlyOwner {
    //     _mint(address(this), id, amount, "");
    // }

    function claim(uint serumId, uint count, bytes memory signature) public payable {
        if(msg.value < count * serumPrices[serumId]) revert NotEnoughEther();
        if(!validMint(msg.sender, serumId, count, signature)) revert InvalidVoucher();
        _mint(msg.sender, serumId, count, "");
    }

    function ownerMint(uint id, uint amount, address receiver) public onlyOwner {
        _mint(receiver, id, amount, "");
    }

    /*///////////////////////////////////////////////////////////////
                            EVOLUTION LOGIC
    //////////////////////////////////////////////////////////////*/

    function evolve(uint tokenId, uint serumId, uint nonce, uint evolutionStage, bytes memory signature) public correctNonce(nonce) {
        if(pixelmonContract.ownerOf(tokenId) != msg.sender) revert InvalidOwner();
        if(!validEvolution(msg.sender, serumId, tokenId, evolutionStage, nonce, signature)) revert InvalidEvolution();
        _burn(msg.sender, serumId, 1);
        pixelmonContract.mintEvolvedPixelmon(msg.sender, evolutionStage);
        emit Evolution(tokenId, evolutionStage);
    }

    /*///////////////////////////////////////////////////////////////
                                UTILS
    //////////////////////////////////////////////////////////////*/

    function validMint(address user, uint serumId, uint count, bytes memory signature) public returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(user, serumId, count));
        if(usedVouchers[messageHash]) return false;

        usedVouchers[messageHash] = true;
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        return recoverSigner(ethSignedMessageHash, signature) == evolutionSigner;
    }

    function validEvolution(address user, uint serumId, uint pixelmonId, uint evolutionStage, uint nonce, bytes memory signature)
        public
        pure
        returns (bool)
    {
        bytes32 messageHash = keccak256(abi.encodePacked(user, serumId, pixelmonId, evolutionStage, nonce));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == evolutionSigner;
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        private
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) private pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        private
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "sig invalid");

        assembly {
            /*
        First 32 bytes stores the length of the signature
        add(sig, 32) = pointer of sig + 32
        effectively, skips first 32 bytes of signature
        mload(p) loads next 32 bytes starting at the memory address p into memory
        */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    /// @notice Withdraws collected funds to the Gnosis Safe address
    function withdraw() public onlyOwner {
        (bool success, ) = gnosisSafeAddress.call{value: address(this).balance}("");
        require(success);
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes4) {
        return ERC1155TokenReceiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external returns (bytes4) {
        return ERC1155TokenReceiver.onERC1155BatchReceived.selector;
    }
}
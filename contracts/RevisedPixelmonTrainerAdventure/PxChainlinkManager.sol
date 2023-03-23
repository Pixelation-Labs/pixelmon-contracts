// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

/// @title Pixelmon Trainer Adventure Smart Contract
/// @author LiquidX
/// @notice This smart contract provides configuration for the Trainer Adventure event on Pixelmon
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error NotAllowedToCall();

contract PxChainlinkManager is EIP712, Ownable, VRFConsumerBaseV2 {
    /// @dev Signing domain for the purpose of creating signature
    string public constant SIGNING_DOMAIN = "Pixelmon-Trainer-Adventure";
    /// @dev signature version for creating and verifying signature
    string public constant SIGNATURE_VERSION = "1";

    /// @dev Signer wallet address for signature verification
    address public SIGNER;

    /// @notice Amount of random number requested to Chainlink
    uint32 public constant Random_Number_Count = 3;

    /// @notice Struct object to send request to Chainlink
    /// @param fulfilled Whether the random words has been set or not
    /// @param exists Whether the request has been sent or not
    /// @param weekNumber Draw week number
    /// @param randomWords Random words from Chainlink
    struct Request {
        bool fulfilled;
        bool exists;
        uint256 weekNumber;
        uint256[] randomWords;
    }

    /// @notice Struct object to save weekly chainlink random numbers 
    /// @param randomNumbers weekly chainlink random numbers
    struct WeeklyRandomNumber {
        uint256[] randomNumbers;
    }

    /// @notice Map of weekly chainlink random numbers
    mapping(uint256 => WeeklyRandomNumber) weeklyRandomNumbers;

    /// @notice address of trainer adventure smart contract
    address public trainerAdventureContractAddress;

    // @notice The maximum gas price to pay for a request to Chainlink in wei.
    ///   keyHash The gas lane to use, which specifies the maximum gas price to bump to.
    ///   More https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    bytes32 public keyHash;
    /// @notice How many confirmations the Chainlink node should wait before responding
    uint16 requestConfirmations = 3;
    /// @notice Chainlink subscription ID that used for sending request
    uint64 public chainLinkSubscriptionId;
    /// @notice Gas limit used to call Chainlink
    uint32 public callbackGasLimit = 400000;
    /// @notice Address that is able to call Chainlink
    VRFCoordinatorV2Interface internal COORDINATOR;
    /// @notice Last request ID to Chainlink
    uint256 public lastRequestId;
    /// @notice Collection of chainlink request ID
    uint256[] public requestIds;
    /// @notice Map of request to Chainlink
    mapping(uint256 => Request) public requests;

    /// @notice Emit when calling fulfillRandomWords function
    /// @param weekNumber The week number when the request is sent to Chainlink
    /// @param RandomWords The input random words
    event ChainlinkRandomNumberSet(uint256 weekNumber, uint256[] RandomWords);

    /// @notice Constructor function
    /// @param _vrfCoordinator The address of the Chainlink VRF Coordinator contract
    /// @param _chainLinkSubscriptionId The Chainlink Subscription ID that is funded to use VRF
    /// @param _keyHash The gas lane to use, which specifies the maximum gas price to bump to.
    ///        More https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    constructor(
        address _signer,
        address _vrfCoordinator,
        uint64 _chainLinkSubscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
        SIGNER = _signer;
    }

    /// @notice Sets Signer wallet address
    /// @dev This function can only be executed by the contract owner
    /// @param signer Signer wallet address for signature verifition
    function setSignerAddress(address signer) external onlyOwner {
        SIGNER = signer;
    }

    /// @notice Recovers signer wallet from signature
    /// @dev View function for signature recovering
    /// @param weekNumber Week number for claim
    /// @param claimIndex Claim index for a particular user for a week
    /// @param walletAddress Token owner wallet address
    /// @param signature Signature from signer wallet
    function isSignerVerifiedFromSignature (
        uint256 weekNumber,
        uint256 claimIndex,
        address walletAddress,
        bytes calldata signature
    ) external view returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("TrainerAdventureSignature(uint256 weekNumber,uint256 claimIndex,address walletAddress)"),
                    weekNumber,
                    claimIndex,
                    walletAddress
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);

        if (signer == SIGNER) {
            return true;
        }

        return false;
    }

    /// @notice Set callback gas limit parameter when sending request to Chainlink
    /// @param _callbackGasLimit Amount of expected gas limit
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
    }

    /// @notice Set trainer adventure contract address
    /// @param _trainerAdventure address of trainer adventure contract address
    function setTrainerAdventureContractAddress(address _trainerAdventure) external onlyOwner {
        trainerAdventureContractAddress = _trainerAdventure;
    }

    /// @notice Set keyHash parameter when sending request to Chainlink
    /// @param _keyHash key Hash for chain link
    function setChainLinkKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    /// @notice Set chainLinkSubscriptionId parameter when sending request to Chainlink
    /// @param _chainLinkSubscriptionId Chainlink subscription Id
    function setChainlinkSubscriptionId(uint64 _chainLinkSubscriptionId) external onlyOwner {
        chainLinkSubscriptionId = _chainLinkSubscriptionId;
    }

    /// @notice Generate random number from Chainlink
    /// @param _weekNumber Number of the week
    /// @return requestId Chainlink requestId
    function generateChainLinkRandomNumbers(uint256 _weekNumber) external returns (uint256 requestId) {
        if (msg.sender != trainerAdventureContractAddress) {
            revert NotAllowedToCall();
        }
        requestId = COORDINATOR.requestRandomWords(keyHash, chainLinkSubscriptionId, requestConfirmations, callbackGasLimit, Random_Number_Count);
        requests[requestId] = Request({randomWords: new uint256[](0), exists: true, fulfilled: false, weekNumber: _weekNumber});
        requestIds.push(requestId);
        lastRequestId = requestId;
        return requestId;
    }

    /// @notice Store random words in a contract
    /// @param _requestId Chainlink request ID
    /// @param _randomWords A collection of random word
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(requests[_requestId].exists, "request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;
        weeklyRandomNumbers[requests[_requestId].weekNumber].randomNumbers = _randomWords;
        emit ChainlinkRandomNumberSet(requests[_requestId].weekNumber, _randomWords);
    }

    /// @notice Get weekly random numbers for specific week
    /// @param _weekNumber The number of the week
    function getWeeklyRandomNumbers(uint256 _weekNumber) external view returns (uint256[] memory randomNumbers) {
        return weeklyRandomNumbers[_weekNumber].randomNumbers;
    }
}

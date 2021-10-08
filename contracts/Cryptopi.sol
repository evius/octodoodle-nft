pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

contract Cryptopi is ERC721Tradable {

    /*
     * Enforce the existence Cryptopi.
     */
    uint256 public constant MAX_SUPPLY;

    /*
    * Reserved for owners, giveaways, airdrops, etc.
    */
    uint public constant RESERVED_SUPPLY = 50;

    string public baseTokenURI;
    string public contractURI;
    

    constructor(
        address _proxyRegistryAddress,
        uint256 maxSupply,
        string memory baseTokenUri,
        string memory contractUri
    )
        ERC721Tradable("Cryptopi", "CPI", _proxyRegistryAddress)
    {
        MAX_SUPPLY = maxSupply;
        baseTokenURI = baseTokenURI;
        contractURI = contractURI;
    }

    function baseTokenURI() override public view returns (string memory) {
        return baseTokenURI;
    }

    function contractURI() public view returns (string memory) {
        return contractURI;
    }

    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    function reservedSupply() public view returns (uint256) {
        return RESERVED_SUPPLY;
    }
}
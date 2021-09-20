pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

contract Cryptopi is ERC721Tradable {
    constructor(address _proxyRegistryAddress)
        ERC721Tradable("Cryptopi", "CPI", _proxyRegistryAddress)
    {}

    function baseTokenURI() override public pure returns (string memory) {
        return "https://creatures-api.opensea.io/api/creature/";
    }

    function contractURI() public pure returns (string memory) {
        return "https://creatures-api.opensea.io/contract/opensea-creatures";
    }
}
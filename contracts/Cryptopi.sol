// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

contract Cryptopi is ERC721Tradable {

    /*
    Enforce the existence Cryptopi.
     */
    uint256 public MAX_SUPPLY;

    /*
    Reserved for owners, giveaways, airdrops, etc.
    */
    uint8 public constant RESERVED_SUPPLY = 50;

    string baseTokenMetadataURI;
    string contractMetatdataURI;

    uint256 public salePrice;
    uint256 public preSalePrice;
    enum SaleState { Pending, PreSaleOpen, Open, Closed}
    SaleState public saleState;

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress,
        uint256 _maxSupply,
        string memory _baseTokenUri,
        string memory _contractUri,
        uint256 _salePrice,
        uint256 _preSalePrice
    )
        ERC721Tradable(_name, _symbol, _proxyRegistryAddress)
    {
        MAX_SUPPLY = _maxSupply;
        baseTokenMetadataURI = _baseTokenUri;
        contractMetatdataURI = _contractUri;

        saleState = SaleState.Pending;
        salePrice = _salePrice;
        preSalePrice = _preSalePrice;
    }

    function baseTokenURI() override public view returns (string memory) {
        return baseTokenMetadataURI;
    }

    function contractURI() public view returns (string memory) {
        return contractMetatdataURI;
    }

    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    function reservedSupply() public pure returns (uint8) {
        return RESERVED_SUPPLY;
    }

    function setSalePrice(uint256 _salePrice) external onlyOwner {
        salePrice = _salePrice;
    }

    function setPreSalePrice(uint256 _preSalePrice) external onlyOwner {
        preSalePrice = _preSalePrice;
    }

    function setContractURI(string memory _contractURI) external onlyOwner {
        contractMetatdataURI = _contractURI;
    }

    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenMetadataURI = _baseTokenURI;
    }
}
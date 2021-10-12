// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Cryptopi is ERC721Tradable {
    using SafeMath for uint256;
    /*
    Enforce the existence Cryptopi.
     */
    uint256 public maxSupply;

    uint256 public preSaleSupply;

    /*
    Reserved for owners, giveaways, airdrops, etc.
    */
    uint8 public constant RESERVED_SUPPLY = 50;

    uint8 public constant MAX_MINTABLE_TOKENS = 20;

    string baseTokenMetadataURI;
    string contractMetatdataURI;

    uint256 public salePrice;
    uint256 public preSalePrice;
    enum SaleState { Pending, PreSaleOpen, Open, Paused, Closed}
    SaleState public saleState;

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress,
        uint256 _maxSupply,
        uint256 _preSaleSupply,
        string memory _baseTokenUri,
        string memory _contractUri,
        uint256 _salePrice,
        uint256 _preSalePrice
    )
        ERC721Tradable(_name, _symbol, _proxyRegistryAddress)
    {
        maxSupply = _maxSupply;
        preSaleSupply = _preSaleSupply;
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

    function setSaleState(SaleState state) external onlyOwner {
        saleState = state;
    }

    function getSaleStateMessage() internal view returns (string memory) {
        if (this.saleState() == SaleState.Pending) {
            return 'Sale not open yet.';
        } else if (this.saleState() == SaleState.Paused) {
            return 'Sale is paused.';
        } else if (this.saleState() == SaleState.Closed) {
            return 'Sale is closed.';
        } else if (this.saleState() == SaleState.PreSaleOpen) {
            return 'Pre-sale is open!';
        } else if (this.saleState() == SaleState.Open) {
            return 'Public sale is open!';
        }

        return 'Uknown sale state';
    }

    function mintFromPublic(uint8 quantity) external payable {
        SaleState state = saleState;
        // Check the sale state before continuing
        require(state == SaleState.PreSaleOpen || state == SaleState.Open, getSaleStateMessage());

        // Validate the requested quantity
        require(quantity > 0, 'Cannot purchase 0 tokens.');
        require(quantity <= MAX_MINTABLE_TOKENS, 'Cannot purchase more than 20 tokens.');

        // Validate the supply
        require(state == SaleState.Open || (state == SaleState.PreSaleOpen 
        && quantity + this.totalSupply() <= preSaleSupply), 
        'Quantity requested will exceed the pre-sale supply.');

        require(state == SaleState.PreSaleOpen || (state == SaleState.Open 
        && quantity + this.totalSupply() <= maxSupply), 
        'Quantity requested will exceed the max supply.');

        // Validate the transaction value
        require(state == SaleState.Open || (state == SaleState.PreSaleOpen && msg.value >= preSalePrice.mul(quantity)), 'Not enough ETH.');
        require(state == SaleState.PreSaleOpen || (state == SaleState.Open && msg.value >= salePrice.mul(quantity)), 'Not enough ETH.');

        for (uint i = 0; i < quantity; i++) {
            mintTo(msg.sender);
        }
    }

    function mintFromFactory(address _to) public {
        mintTo(_to);
    }
}
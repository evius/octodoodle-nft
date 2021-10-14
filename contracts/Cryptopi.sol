// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Cryptopi is ERC721Tradable {
    using SafeMath for uint256;
    /*
    Limits the existence Octodoodles.
     */
    uint256 public maxSupply;

    /*
    The amount of Octodoodles available on pre-sale
    */
    uint256 public preSaleSupply;

    /*
    Reserved for owners, giveaways, airdrops, etc.
    */
    uint16 public maxReserveSupply;
    uint16 public reservedSupply;

    /*
    The amount of Octodoodles that can be minted per transaction. 
    Making it more fair.
    */
    uint8 public constant MAX_MINTABLE_TOKENS = 20;

    /*
    Metadata URI's.
    */
    string baseTokenMetadataURI;
    string contractMetatdataURI;
    string pendingTokenMetadataURI;

    /*
    Sale specs.
    Pre-sale price is the price per Octodoodle when the Pre-sale is open.
    Sale price is the price per Octodoodle when the Public sale is open.
    Sale state controls the various modes of the sale and minting:
    Pending - Sale has not started yet.
    PreSaleOpen - The pre-sale is open. When the pre-sale is complete the sale state will automaticlly change to Open.
    Open - The public sale is open.
    Closed - The sale is closed and no more Octodoodle can be minted.
    */
    uint256 public salePrice;
    uint256 public preSalePrice;
    enum SaleState { Pending, PreSaleOpen, Open, Paused, Closed}
    SaleState public saleState;

    /*
    The address of the OpenSea factory contract.
    This address will be whitelisted for minting.
    */
    address factoryAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress,
        uint256 _maxSupply,
        uint256 _preSaleSupply,
        uint16 _maxReserveSupply,
        string memory _baseTokenUri,
        string memory _contractUri,
        string memory _pendingTokenUri,
        uint256 _salePrice,
        uint256 _preSalePrice
    )
        ERC721Tradable(_name, _symbol, _proxyRegistryAddress)
    {
        maxSupply = _maxSupply;
        preSaleSupply = _preSaleSupply;
        maxReserveSupply = _maxReserveSupply;

        baseTokenMetadataURI = _baseTokenUri;
        contractMetatdataURI = _contractUri;
        pendingTokenMetadataURI = _pendingTokenUri;

        saleState = SaleState.Pending;
        salePrice = _salePrice;
        preSalePrice = _preSalePrice;

        reservedSupply = 0;
    }

    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
    }

    function baseTokenURI() override public view returns (string memory) {
        return baseTokenMetadataURI;
    }

    function contractURI() public view returns (string memory) {
        return contractMetatdataURI;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        if (saleState == SaleState.Pending || _tokenId > this.totalSupply()) {
            return pendingTokenMetadataURI;
        }

        return super.tokenURI(_tokenId);
    }

    function setContractURI(string memory _contractURI) external onlyOwner {
        contractMetatdataURI = _contractURI;
    }

    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenMetadataURI = _baseTokenURI;
    }

    function setPendingTokenURI(string memory _pendingTokenURI) external onlyOwner {
        pendingTokenMetadataURI = _pendingTokenURI;
    }

    function setSalePrice(uint256 _salePrice) external onlyOwner {
        salePrice = _salePrice;
    }

    function setPreSalePrice(uint256 _preSalePrice) external onlyOwner {
        preSalePrice = _preSalePrice;
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
        require(state == SaleState.Open || (state == SaleState.PreSaleOpen && msg.value == preSalePrice.mul(quantity)), 'Not enough ETH.');
        require(state == SaleState.PreSaleOpen || (state == SaleState.Open && msg.value == salePrice.mul(quantity)), 'Not enough ETH.');

        for (uint i = 0; i < quantity; i++) {
            mintTo(msg.sender);
        }

        if (this.totalSupply() == preSaleSupply && state == SaleState.PreSaleOpen) {
            saleState = SaleState.Open;
        }

        if (this.totalSupply() == maxSupply) {
            saleState = SaleState.Closed;
        }
    }

    function mintFromFactory(address _to) external {
        SaleState state = saleState;
        require(msg.sender == factoryAddress, 'Only factory contract can call');
        require(state == SaleState.Open, 'Sale is not open');

        mintTo(_to);

        if (this.totalSupply() == maxSupply) {
            saleState = SaleState.Closed;
        }
    }

    function reserveTokens() external onlyOwner {
        require(reservedSupply < maxReserveSupply, 'Max reserve tokens reached');

        for (uint i = 0; i < maxReserveSupply; i++) {
            mintTo(msg.sender);
        }

        reservedSupply = maxReserveSupply;
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}
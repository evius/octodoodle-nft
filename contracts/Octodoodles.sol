// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './ERC721Tradable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Octodoodles is ERC721Tradable {
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
    The amount of Octodoodles that can be minted per transaction. 
    Making it more fair.
    */
    uint8 public constant MAX_MINTABLE_TOKENS = 30;

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
    enum SaleState {
        Pending,
        PreSaleOpen,
        Open,
        Paused,
        Closed
    }
    SaleState public saleState;

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress,
        uint256 _maxSupply,
        uint256 _preSaleSupply,
        string memory _baseTokenUri,
        string memory _contractUri,
        string memory _pendingTokenUri,
        uint256 _salePrice,
        uint256 _preSalePrice
    ) ERC721Tradable(_name, _symbol, _proxyRegistryAddress) {
        maxSupply = _maxSupply;
        preSaleSupply = _preSaleSupply;

        baseTokenMetadataURI = _baseTokenUri;
        contractMetatdataURI = _contractUri;
        pendingTokenMetadataURI = _pendingTokenUri;

        saleState = SaleState.Open;
        salePrice = _salePrice;
        preSalePrice = _preSalePrice;
    }

    function baseTokenURI() public view override returns (string memory) {
        return baseTokenMetadataURI;
    }

    function contractURI() public view returns (string memory) {
        return contractMetatdataURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
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

    function setPendingTokenURI(string memory _pendingTokenURI)
        external
        onlyOwner
    {
        pendingTokenMetadataURI = _pendingTokenURI;
    }

    function pendingTokenURI() external view returns (string memory) {
        return pendingTokenMetadataURI;
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

    function _checkAndCloseSale() internal {
        if (this.totalSupply() == maxSupply) {
            saleState = SaleState.Closed;
        }
    }

    function _checkAndOpenSale() internal {
        if (
            this.totalSupply() == preSaleSupply &&
            saleState == SaleState.PreSaleOpen
        ) {
            saleState = SaleState.Open;
        }
    }

    /**
    @dev Validates the sale state, quantity, supply and eth before minting
    */
    function _canMintPublic(uint8 quantity) internal view {
        // Check the sale state before continuing
        require(
            saleState == SaleState.PreSaleOpen || saleState == SaleState.Open,
            getSaleStateMessage()
        );

        // Validate the requested quantity
        require(quantity > 0, 'Cannot purchase 0 tokens.');
        require(
            quantity <= MAX_MINTABLE_TOKENS,
            'Cannot purchase more than 20 tokens.'
        );

        // Validate the supply
        require(
            saleState == SaleState.Open ||
                (saleState == SaleState.PreSaleOpen &&
                    quantity + this.totalSupply() <= preSaleSupply),
            'Quantity requested will exceed the pre-sale supply.'
        );

        require(
            saleState == SaleState.PreSaleOpen ||
                (saleState == SaleState.Open &&
                    quantity + this.totalSupply() <= maxSupply),
            'Quantity requested will exceed the max supply.'
        );

        // Validate the transaction value
        require(
            saleState == SaleState.Open ||
                (saleState == SaleState.PreSaleOpen &&
                    msg.value == preSalePrice.mul(quantity)),
            'Not enough ETH.'
        );
        require(
            saleState == SaleState.PreSaleOpen ||
                (saleState == SaleState.Open &&
                    msg.value == salePrice.mul(quantity)),
            'Not enough ETH.'
        );
    }

    /** 
    @dev Mint the supplied quantity of tokens (up to 20).
    Available to public and the exact amount of ETH must be supplied
    */
    function mintFromPublic(uint8 quantity) external payable {
        // Validation before minting
        _canMintPublic(quantity);

        // If validation passes then mint the tokens
        for (uint256 i = 0; i < quantity; i++) {
            mintTo(msg.sender);
        }

        // Check for preSaleSupply reached and open the public sale if so
        _checkAndOpenSale();
        // Check for maxSupply - maxReservedSupply reach and close the sale if so
        _checkAndCloseSale();
    }

    /** 
    @dev Reserves the maxReservedSupply
    */
    function mintFromOwner(uint8 quantity) external onlyOwner {
        require(
            totalSupply() + quantity < maxSupply,
            'Cannot mint more than maxSupply'
        );

        for (uint256 i = 0; i < quantity; i++) {
            mintTo(msg.sender);
        }
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}

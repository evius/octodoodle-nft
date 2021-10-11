const { accounts, contract } = require('@openzeppelin/test-environment');
const [owner] = accounts;
const {
  BN, // Big Number support
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { describe, beforeAll, beforeEach } = require('jest-circus');

const Cryptopi = contract.fromArtifact('Cryptopi');

const SaleState = {
  Pending: new BN('0'),
  PreSaleOpen: new BN('1'),
  Open: new BN('2'),
  Paused: new BN('3'),
  Closed: new BN('4'),
};

describe('Cryptopi', () => {
  beforeEach(async () => {
    this.cryptopi = await Cryptopi.new(
      'Cryptopi',
      'CPI',
      owner,
      1000,
      'ipfs://test',
      'ipfs://test/contract',
      100,
      50
    );
  });
  it('should construct the contract with correct state', async function () {
    expect(await this.cryptopi.totalSupply()).to.be.bignumber.equal('0');
    expect(await this.cryptopi.maxSupply()).to.be.bignumber.equal('1000');
    expect(await this.cryptopi.baseTokenURI()).to.equal('ipfs://test');
    expect(await this.cryptopi.contractURI()).to.equal('ipfs://test/contract');
    expect(await this.cryptopi.salePrice()).to.be.bignumber.equal('100');
    expect(await this.cryptopi.preSalePrice()).to.be.bignumber.equal('50');
    expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
      SaleState.Pending
    );
  });

  describe('setSaleState', () => {
    it('sets the sale state to Pending', async () => {
      // Default state is pending so set to open first
      await this.cryptopi.setSaleState(SaleState.Open);
      await this.cryptopi.setSaleState(SaleState.Pending);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });

    it('sets the sale state to PreSaleOpen', async () => {
      await this.cryptopi.setSaleState(SaleState.PreSaleOpen);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.PreSaleOpen
      );
    });

    it('sets the sale state to Open', async () => {
      await this.cryptopi.setSaleState(SaleState.Open);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Open
      );
    });

    it('sets the sale state to Paused', async () => {
      await this.cryptopi.setSaleState(SaleState.Paused);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Paused
      );
    });

    it('sets the sale state to Closed', async () => {
      await this.cryptopi.setSaleState(SaleState.Closed);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });

    it('fails gracefully when state is unknown', async () => {
      // Default state is pending so set to open first
      expect(() => await this.cryptopi.setSaleState('10'));
      await this.cryptopi.setSaleState('-1');

      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });
  });

  describe('setContractURI', () => {
    it('updates the contract URI', async () => {
      const newUri = 'ipfs://new-contract-uri/contract';
      await this.cryptopi.setContractURI(newUri);
      expect(await this.cryptopi.contractURI()).to.equal(newUri);
    });
  });

  describe('setBaseTokenURI', () => {
    it('updates the base token URI', async () => {
      const newUri = 'ipfs://new-token-uri';
      await this.cryptopi.setBaseTokenURI(newUri);
      expect(await this.cryptopi.baseTokenURI()).to.equal(newUri);
    });
  });

  describe('mintFromPublic', () => {
    it('can be called by public', () => {});

    it('mints when sale state is PreSaleOpen or Open', () => {});

    it('does not mint when sale state is Pending, Paused or Closed', () => {});

    it('sets the sale state to closed when tokenSupply reaches maxSupply - reserved', () => {});

    it('requires the pre-sale price when sale state is PreSaleOpen', () => {});

    it('requires the sale price when sale state is Open', () => {});

    it('calculates the pre-sale price correctly for quantity', () => {});

    it('calculates the sale price correctly for quantity', () => {});
  });

  describe('mintFromFactory', () => {
    it('can only be called by the factory contract', () => {});

    it('sets the sale state to closed when tokenSupply reaches maxSupply - reserved', () => {});
  });
  describe('mintFromOwner', () => {
    it('can only be called by the owner', () => {});

    it('only allows reserved supply tokens to be minted', () => {});
  });

  describe('withdraw', () => {
    it('can only be called by the owner', () => {});

    it('withdraws funds to the owner', () => {});
  });
});

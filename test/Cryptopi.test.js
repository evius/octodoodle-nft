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
    it('sets the sale state to PreSaleOpen from Pending', async () => {
      await this.cryptopi.setSaleState(SaleState.PreSaleOpen);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.PreSaleOpen
      );
    });

    it('sets the sale state to Open from Pending', async () => {
      await this.cryptopi.setSaleState(SaleState.Open);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Open
      );
    });

    it('sets the sale state to Paused from PreSaleOpen', async () => {
      await this.cryptopi.setSaleState(SaleState.PreSaleOpen);
      await this.cryptopi.setSaleState(SaleState.Paused);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Paused
      );
    });

    it('sets the sale state to Paused from Open', async () => {
      await this.cryptopi.setSaleState(SaleState.Open);
      await this.cryptopi.setSaleState(SaleState.Paused);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Paused
      );
    });

    it('sets the sale state to Open from PreSaleOpen', async () => {
      await this.cryptopi.setSaleState(SaleState.PreSaleOpen);
      await this.cryptopi.setSaleState(SaleState.Open);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Open
      );
    });

    it('sets the sale state to Closed from SaleOpen', async () => {
      await this.cryptopi.setSaleState(SaleState.Open);
      await this.cryptopi.setSaleState(SaleState.Closed);
      expect(await this.cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });

    it('does not set the sale state to PreSaleOpen from SaleOpen', async () => {});

    it('does not set the sale state to Pending from SaleOpen', async () => {});

    it('does not set the sale state to Pending from PreSaleOpen', async () => {});

    it('does not set the sale state to Paused from Closed', async () => {});

    it('does not set the sale state to PreSaleOpen from Closed', async () => {});

    it('does not set the sale state to SaleOpen from Closed', async () => {});

    it('does not set the sale state to Pending from Closed', async () => {});

    it('updates to Closed when sold out', async () => {});
  });
});

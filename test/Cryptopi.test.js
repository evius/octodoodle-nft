const { accounts, contract } = require('@openzeppelin/test-environment');
const [owner, user] = accounts;
const {
  BN, // Big Number support
  expectRevert,
} = require('@openzeppelin/test-helpers');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;

chai.use(chaiAsPromised);

const Cryptopi = contract.fromArtifact('Cryptopi');

const SaleState = {
  Pending: new BN('0'),
  PreSaleOpen: new BN('1'),
  Open: new BN('2'),
  Paused: new BN('3'),
  Closed: new BN('4'),
};

const EXCEPTION_MESSAGES = {
  Ownable_Caller_Not_Owner:
    'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.',
};

describe('Cryptopi', () => {
  let cryptopi = null;
  const salePrice = new BN('200');
  const preSalePrice = new BN('100');

  beforeEach(async () => {
    cryptopi = await Cryptopi.new(
      'Cryptopi',
      'CPI',
      owner,
      1000,
      'ipfs://test',
      'ipfs://test/contract',
      salePrice,
      preSalePrice,
      { from: owner }
    );
  });
  it('should construct the contract with correct state', async function () {
    expect(await cryptopi.totalSupply()).to.be.bignumber.equal('0');
    expect(await cryptopi.maxSupply()).to.be.bignumber.equal('1000');
    expect(await cryptopi.baseTokenURI()).to.equal('ipfs://test');
    expect(await cryptopi.contractURI()).to.equal('ipfs://test/contract');
    expect(await cryptopi.salePrice()).to.be.bignumber.equal('100');
    expect(await cryptopi.preSalePrice()).to.be.bignumber.equal('50');
    expect(await cryptopi.saleState()).to.be.bignumber.equal(SaleState.Pending);
  });

  it('the deployer is the owner', async function () {
    expect(await cryptopi.owner()).to.equal(owner);
  });

  describe('setSaleState', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        cryptopi.setSaleState(SaleState.Open, { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('sets the sale state to Pending', async () => {
      // Default state is pending so set to open first
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await cryptopi.setSaleState(SaleState.Pending, { from: owner });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });

    it('sets the sale state to PreSaleOpen', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.PreSaleOpen
      );
    });

    it('sets the sale state to Open', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(SaleState.Open);
    });

    it('sets the sale state to Paused', async () => {
      await cryptopi.setSaleState(SaleState.Paused, { from: owner });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Paused
      );
    });

    it('sets the sale state to Closed', async () => {
      await cryptopi.setSaleState(SaleState.Closed, { from: owner });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });

    it('fails gracefully when state is unknown', async () => {
      // Default state is pending so set to open first
      await expectRevert(cryptopi.setSaleState(new BN('10')), 'revert');
      await expectRevert(
        cryptopi.setSaleState(new BN('-1')),
        'value out-of-bounds (argument="state", value="-1", code=INVALID_ARGUMENT, version=abi/5.0.7)'
      );
      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });
  });

  describe('setContractURI', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        cryptopi.setContractURI('test', { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('updates the contract URI', async () => {
      const newUri = 'ipfs://new-contract-uri/contract';
      await cryptopi.setContractURI(newUri, { from: owner });
      expect(await cryptopi.contractURI()).to.equal(newUri);
    });
  });

  describe('setBaseTokenURI', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        cryptopi.setBaseTokenURI('test', { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });
    it('updates the base token URI', async () => {
      const newUri = 'ipfs://new-token-uri';
      await cryptopi.setBaseTokenURI(newUri, { from: owner });
      expect(await cryptopi.baseTokenURI()).to.equal(newUri);
    });
  });

  describe('mintFromPublic', () => {
    it('does not mint when sale state is Pending, Paused or Closed', async () => {
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Sale not open yet. Please try again later.'
      );

      await cryptopi.setSaleState(SaleState.Paused);
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Sale is paused. Please try again later.'
      );

      await cryptopi.setSaleState(SaleState.Closed);
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Sale is closed. Checkout opensea.io.'
      );
    });

    it('requires the pre-sale price when sale state is PreSaleOpen', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen);
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH. The pre-sale price is ' + preSalePrice
      );
    });

    it('requires the sale price when sale state is Open', () => {
      await cryptopi.setSaleState(SaleState.Open);
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH. The sale price is ' + salePrice
      );
    });

    it('can be called by public', async () => {});

    it('mints when sale state is PreSaleOpen or Open', () => {});

    it('sets the sale state to closed when tokenSupply reaches maxSupply - reserved', () => {});

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

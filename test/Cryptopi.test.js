const { accounts, contract } = require('@openzeppelin/test-environment');
const [owner, user, factory] = accounts;
const {
  expectRevert,
  ether,
  balance,
  BN,
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
  const salePrice = ether('0.06');
  const preSalePrice = ether('0.04');

  beforeEach(async () => {
    cryptopi = await Cryptopi.new(
      'Cryptopi',
      'CPI',
      owner,
      100,
      40,
      10,
      'ipfs://test',
      'ipfs://test/contract',
      salePrice,
      preSalePrice,
      factory,
      { from: owner }
    );
  });
  it('should construct the contract with correct state', async function () {
    expect(await cryptopi.totalSupply()).to.be.bignumber.equal('0');
    expect(await cryptopi.maxSupply()).to.be.bignumber.equal('100');
    expect(await cryptopi.preSaleSupply()).to.be.bignumber.equal('40');
    expect(await cryptopi.maxReserveSupply()).to.be.bignumber.equal('10');
    expect(await cryptopi.baseTokenURI()).to.equal('ipfs://test');
    expect(await cryptopi.contractURI()).to.equal('ipfs://test/contract');
    expect(await cryptopi.salePrice()).to.be.bignumber.equal(ether('0.06'));
    expect(await cryptopi.preSalePrice()).to.be.bignumber.equal(ether('0.04'));
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
        'Sale not open yet.'
      );

      await cryptopi.setSaleState(SaleState.Paused, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Sale is paused.'
      );

      await cryptopi.setSaleState(SaleState.Closed, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Sale is closed.'
      );
    });

    it('requires the pre-sale price when sale state is PreSaleOpen', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH.'
      );
    });

    it('requires the sale price when sale state is Open', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH.'
      );
    });

    it('calculates the sale price correctly for quantity', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.06'),
        }),
        'Not enough ETH.'
      );

      await cryptopi.mintFromPublic(new BN('5'), {
        from: user,
        value: ether('0.3'),
      });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('5');
    });

    it('calculates the pre-sale price correctly for quantity', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.04'),
        }),
        'Not enough ETH.'
      );

      await cryptopi.mintFromPublic(new BN('5'), {
        from: user,
        value: ether('0.2'),
      });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('5');
    });

    it('requires less than or equal to MAX_MINTABLE_TOKENS (20)', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('21'), {
          from: user,
          value: ether('1.26'),
        }),
        'Cannot purchase more than 20 tokens.'
      );

      await cryptopi.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('1.2'),
      });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('20');
    });

    it('reverts when quantity less than or equal to 0', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        cryptopi.mintFromPublic(new BN('0'), {
          from: user,
          value: ether('0.06'),
        }),
        'Cannot purchase 0 tokens.'
      );

      await expectRevert(
        cryptopi.mintFromPublic(new BN('-1'), {
          from: user,
          value: ether('0.06'),
        }),
        'value out-of-bounds (argument="quantity", value="-1", code=INVALID_ARGUMENT, version=abi/5.0.7)'
      );
    });

    it('reverts when quantity + totalSupply is greater than preSaleSupply', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await cryptopi.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      await cryptopi.mintFromPublic(new BN('17'), {
        from: user,
        value: ether('0.68'),
      });

      await expectRevert(
        cryptopi.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.2'),
        }),
        'Quantity requested will exceed the pre-sale supply.'
      );
    });

    it('reverts when quantity + totalSupply is greater than maxSupply', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 4; i++) {
        await cryptopi.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }
      await cryptopi.mintFromPublic(new BN('17'), {
        from: user,
        value: ether('1.02'),
      });

      await expectRevert(
        cryptopi.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.2'),
        }),
        'Quantity requested will exceed the max supply.'
      );
    });

    it('mints when sale state is PreSaleOpen or Open', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });

      await cryptopi.mintFromPublic(new BN('2'), {
        from: user,
        value: ether('0.08'),
      });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('2');

      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await cryptopi.mintFromPublic(new BN('3'), {
        from: user,
        value: ether('0.18'),
      });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('5');
      expect(await balance.current(cryptopi.address)).to.be.bignumber.equal(
        ether('0.26')
      );
    });

    it('sets the sale state to Open from PreSaleOpen when totalSupply reaches preSaleSupply', async () => {
      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await cryptopi.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      await cryptopi.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      expect(await cryptopi.saleState()).to.be.bignumber.equal(SaleState.Open);
    });

    it('sets the sale state to closed when tokenSupply reaches maxSupply', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 5; i++) {
        await cryptopi.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }

      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });
  });

  describe('mintFromFactory', () => {
    it('can only be called by the factory contract', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        cryptopi.mintFromFactory(user, { from: owner }),
        'Only factory contract can call'
      );

      await expectRevert(
        cryptopi.mintFromFactory(user, { from: user }),
        'Only factory contract can call'
      );

      await cryptopi.mintFromFactory(user, { from: factory });
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('1');
    });

    it('does not mint when sale state is Pending, PreSaleOpen Paused or Closed', async () => {
      await expectRevert(
        cryptopi.mintFromFactory(user, { from: factory }),
        'Sale is not open'
      );

      await cryptopi.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await expectRevert(
        cryptopi.mintFromFactory(user, { from: factory }),
        'Sale is not open'
      );

      await cryptopi.setSaleState(SaleState.Paused, { from: owner });
      await expectRevert(
        cryptopi.mintFromFactory(user, { from: factory }),
        'Sale is not open'
      );

      await cryptopi.setSaleState(SaleState.Closed, { from: owner });
      await expectRevert(
        cryptopi.mintFromFactory(user, { from: factory }),
        'Sale is not open'
      );
    });

    it('sets the sale state to closed when tokenSupply reaches maxSupply', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 100; i++) {
        await cryptopi.mintFromFactory(user, { from: factory });
      }

      expect(await cryptopi.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });
  });

  describe('withdraw', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        cryptopi.withdraw({ from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('withdraws funds to the owner', async () => {
      await cryptopi.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 5; i++) {
        await cryptopi.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }

      const tracker = await balance.tracker(owner);

      await cryptopi.withdraw({ from: owner });

      const { delta, fees } = await tracker.deltaWithFees();
      expect(delta.add(fees)).to.be.bignumber.equal(ether('6'));
    });
  });

  describe('reserveTokens', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        cryptopi.reserveTokens({ from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('reserves the reserveSupply', async () => {
      await cryptopi.reserveTokens({ from: owner });
      expect(await cryptopi.reservedSupply()).to.be.bignumber.equal('10');
      expect(await cryptopi.totalSupply()).to.be.bignumber.equal('10');
    });

    it('does not reserve more than the reserve supply', async () => {
      await cryptopi.reserveTokens({ from: owner });

      await expectRevert(
        cryptopi.reserveTokens({ from: owner }),
        'Max reserve tokens reached'
      );
    });
  });
});

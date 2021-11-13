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

const Octodoodles = contract.fromArtifact('Octodoodles');

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

describe('Octodoodles', () => {
  let octodoodles = null;
  const salePrice = ether('0.06');
  const preSalePrice = ether('0.04');

  beforeEach(async () => {
    octodoodles = await Octodoodles.new(
      'Octodoodles',
      'OCD',
      owner,
      100,
      40,
      'ipfs://test',
      'ipfs://test/contract.json',
      'ipfs://test/pendingToken.json',
      salePrice,
      preSalePrice,
      { from: owner }
    );
  });
  it('should construct the contract with correct state', async function () {
    expect(await octodoodles.totalSupply()).to.be.bignumber.equal('0');
    expect(await octodoodles.maxSupply()).to.be.bignumber.equal('100');
    expect(await octodoodles.preSaleSupply()).to.be.bignumber.equal('40');
    expect(await octodoodles.baseTokenURI()).to.equal('ipfs://test');
    expect(await octodoodles.contractURI()).to.equal(
      'ipfs://test/contract.json'
    );
    expect(await octodoodles.pendingTokenURI()).to.equal(
      'ipfs://test/pendingToken.json'
    );
    expect(await octodoodles.salePrice()).to.be.bignumber.equal(ether('0.06'));
    expect(await octodoodles.preSalePrice()).to.be.bignumber.equal(
      ether('0.04')
    );
    expect(await octodoodles.saleState()).to.be.bignumber.equal(
      SaleState.Pending
    );
  });

  it('the deployer is the owner', async function () {
    expect(await octodoodles.owner()).to.equal(owner);
  });

  describe('setSaleState', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.setSaleState(SaleState.Open, { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('sets the sale state to Pending', async () => {
      // Default state is pending so set to open first
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await octodoodles.setSaleState(SaleState.Pending, { from: owner });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });

    it('sets the sale state to PreSaleOpen', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.PreSaleOpen
      );
    });

    it('sets the sale state to Open', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Open
      );
    });

    it('sets the sale state to Paused', async () => {
      await octodoodles.setSaleState(SaleState.Paused, { from: owner });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Paused
      );
    });

    it('sets the sale state to Closed', async () => {
      await octodoodles.setSaleState(SaleState.Closed, { from: owner });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });

    it('fails gracefully when state is unknown', async () => {
      // Default state is pending so set to open first
      await expectRevert(octodoodles.setSaleState(new BN('10')), 'revert');
      await expectRevert(
        octodoodles.setSaleState(new BN('-1')),
        'value out-of-bounds (argument="state", value="-1", code=INVALID_ARGUMENT, version=abi/5.0.7)'
      );
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Pending
      );
    });
  });

  describe('setContractURI', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.setContractURI('test', { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('updates the contract URI', async () => {
      const newUri = 'ipfs://new-contract-uri/contract';
      await octodoodles.setContractURI(newUri, { from: owner });
      expect(await octodoodles.contractURI()).to.equal(newUri);
    });
  });

  describe('setBaseTokenURI', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.setBaseTokenURI('test', { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });
    it('updates the base token URI', async () => {
      const newUri = 'ipfs://new-token-uri';
      await octodoodles.setBaseTokenURI(newUri, { from: owner });
      expect(await octodoodles.baseTokenURI()).to.equal(newUri);
    });
  });

  describe('tokenURI', () => {
    it('returns the pending token URI when the sale is pending', async () => {
      expect(await octodoodles.tokenURI(new BN('1'))).to.equal(
        'ipfs://test/pendingToken.json'
      );
    });

    it('returns the pending token URI when the token has not been minted yet', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      expect(await octodoodles.tokenURI(new BN('1'))).to.equal(
        'ipfs://test/pendingToken.json'
      );
    });

    it('returns the token URI when available', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });

      await octodoodles.mintFromPublic(new BN('5'), {
        from: user,
        value: ether('0.3'),
      });

      expect(await octodoodles.tokenURI(new BN('2'))).to.equal(
        'ipfs://test/2.json'
      );
      expect(await octodoodles.tokenURI(new BN('5'))).to.equal(
        'ipfs://test/5.json'
      );
    });
  });

  describe('setPendingTokenURI', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.setPendingTokenURI('test', { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });
    it('updates the pending token URI', async () => {
      const newUri = 'ipfs://test/new-token-uri.json';
      await octodoodles.setPendingTokenURI(newUri, { from: owner });
      expect(await octodoodles.pendingTokenURI()).to.equal(newUri);
    });
  });

  describe('mintFromPublic', () => {
    it('does not mint when sale state is Pending, Paused or Closed', async () => {
      await expectRevert(
        octodoodles.mintFromPublic(new BN('1'), { from: user }),
        'Sale not open yet.'
      );

      await octodoodles.setSaleState(SaleState.Paused, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('1'), { from: user }),
        'Sale is paused.'
      );

      await octodoodles.setSaleState(SaleState.Closed, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('1'), { from: user }),
        'Sale is closed.'
      );
    });

    it('requires the pre-sale price when sale state is PreSaleOpen', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH.'
      );
    });

    it('requires the sale price when sale state is Open', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('1'), { from: user }),
        'Not enough ETH.'
      );
    });

    it('calculates the sale price correctly for quantity', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.06'),
        }),
        'Not enough ETH.'
      );

      await octodoodles.mintFromPublic(new BN('5'), {
        from: user,
        value: ether('0.3'),
      });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('5');
    });

    it('calculates the pre-sale price correctly for quantity', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.04'),
        }),
        'Not enough ETH.'
      );

      await octodoodles.mintFromPublic(new BN('5'), {
        from: user,
        value: ether('0.2'),
      });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('5');
    });

    it('requires less than or equal to MAX_MINTABLE_TOKENS (30)', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('31'), {
          from: user,
          value: ether('1.86'),
        }),
        'Cannot purchase more than 20 tokens.'
      );

      await octodoodles.mintFromPublic(new BN('30'), {
        from: user,
        value: ether('1.8'),
      });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('30');
    });

    it('reverts when quantity less than or equal to 0', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await expectRevert(
        octodoodles.mintFromPublic(new BN('0'), {
          from: user,
          value: ether('0.06'),
        }),
        'Cannot purchase 0 tokens.'
      );

      await expectRevert(
        octodoodles.mintFromPublic(new BN('-1'), {
          from: user,
          value: ether('0.06'),
        }),
        'value out-of-bounds (argument="quantity", value="-1", code=INVALID_ARGUMENT, version=abi/5.0.7)'
      );
    });

    it('reverts when quantity + totalSupply is greater than preSaleSupply', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await octodoodles.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      await octodoodles.mintFromPublic(new BN('17'), {
        from: user,
        value: ether('0.68'),
      });

      await expectRevert(
        octodoodles.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.2'),
        }),
        'Quantity requested will exceed the pre-sale supply.'
      );
    });

    it('reverts when quantity + totalSupply is greater than maxSupply', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 4; i++) {
        await octodoodles.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }
      await octodoodles.mintFromPublic(new BN('17'), {
        from: user,
        value: ether('1.02'),
      });

      await expectRevert(
        octodoodles.mintFromPublic(new BN('5'), {
          from: user,
          value: ether('0.2'),
        }),
        'Quantity requested will exceed the max supply.'
      );
    });

    it('mints when sale state is PreSaleOpen or Open', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });

      await octodoodles.mintFromPublic(new BN('2'), {
        from: user,
        value: ether('0.08'),
      });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('2');

      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      await octodoodles.mintFromPublic(new BN('3'), {
        from: user,
        value: ether('0.18'),
      });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('5');
      expect(await balance.current(octodoodles.address)).to.be.bignumber.equal(
        ether('0.26')
      );
    });

    it('sets the sale state to Open from PreSaleOpen when totalSupply reaches preSaleSupply', async () => {
      await octodoodles.setSaleState(SaleState.PreSaleOpen, { from: owner });
      await octodoodles.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      await octodoodles.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('0.8'),
      });
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Open
      );
    });

    it('sets the sale state to closed when tokenSupply reaches maxSupply', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 4; i++) {
        await octodoodles.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }
      await octodoodles.mintFromPublic(new BN('20'), {
        from: user,
        value: ether('1.2'),
      });

      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('100');
      expect(await octodoodles.saleState()).to.be.bignumber.equal(
        SaleState.Closed
      );
    });
  });

  describe('withdraw', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.withdraw({ from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('withdraws funds to the owner', async () => {
      await octodoodles.setSaleState(SaleState.Open, { from: owner });
      for (let i = 0; i < 5; i++) {
        await octodoodles.mintFromPublic(new BN('20'), {
          from: user,
          value: ether('1.2'),
        });
      }

      const tracker = await balance.tracker(owner);

      await octodoodles.withdraw({ from: owner });

      const { delta, fees } = await tracker.deltaWithFees();
      expect(delta.add(fees)).to.be.bignumber.equal(ether('6'));
    });
  });

  describe('mintFromOwner', () => {
    it('can only be called by the owner', async () => {
      await expectRevert(
        octodoodles.mintFromOwner(new BN('20'), { from: user }),
        EXCEPTION_MESSAGES.Ownable_Caller_Not_Owner
      );
    });

    it('mints the given quantity', async () => {
      await octodoodles.mintFromOwner(new BN('20'), { from: owner });
      expect(await octodoodles.totalSupply()).to.be.bignumber.equal('20');
    });

    it('does not reserve more than the maxSupply', async () => {
      for (let i = 0; i < 4; i++) {
        await octodoodles.mintFromOwner(new BN('20'), {
          from: owner,
        });
      }
      await octodoodles.mintFromOwner(new BN('10'), { from: owner });

      await expectRevert(
        octodoodles.mintFromOwner(new BN('20'), { from: owner }),
        'Cannot mint more than maxSupply'
      );
    });
  });
});

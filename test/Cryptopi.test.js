const { accounts, contract } = require('@openzeppelin/test-environment');
const [owner] = accounts;
const {
  BN, // Big Number support
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Cryptopi = contract.fromArtifact('Cryptopi');

describe('Cryptopi', () => {
  it('should construct the contract with correct state', async () => {
    const cryptopi = await Cryptopi.new(
      'Cryptopi',
      'CPI',
      owner,
      1000,
      'ipfs://test',
      'ipfs://test/contract',
      100,
      50
    );
    expect(await cryptopi.totalSupply()).to.be.bignumber.equal('0');
  });
});

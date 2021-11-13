const { ether } = require('@openzeppelin/test-helpers');
module.exports = {
  ownerAddress: '0x10e1B58176a29C20E955ec6Db2f45b86Df0fCB60',
  Octodoodles: {
    name: 'Octodoodles',
    symbol: 'OCD',
    proxyRegistryAddress: '0xf57b2c51ded3a29e6891aba85459d600256cf317',
    maxSupply: '1000',
    preSaleSupply: '100',
    baseTokenUri: 'ipfs://QmQ9TS96a5Muszy6d8L4AQqMBEYwYf4N2EPCUaiBRTmzti',
    contractUri: 'ipfs://QmY91eqdmzXJRma7Ncjqaih8HBxUZTQCG7BvTf3Us1NkKe',
    pendingTokenUri: 'ipfs://QmXsg116NWjuMDUdHXRDN9fj5Vvf1BN8GY6LrQXy9BB9d6',
    salePrice: ether('0.02'),
    preSalePrice: ether('0.01'),
  },
};

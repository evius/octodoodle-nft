const { ether } = require('@openzeppelin/test-helpers');
module.exports = {
  ownerAddress: '0x10e1B58176a29C20E955ec6Db2f45b86Df0fCB60',
  Octodoodles: {
    name: 'Octodoodles',
    symbol: 'OCD',
    proxyRegistryAddress: '0xa5409ec958c83c3f309868babaca7c86dcb077c1',
    maxSupply: '5000',
    preSaleSupply: '0',
    baseTokenUri: 'ipfs://QmQ9TS96a5Muszy6d8L4AQqMBEYwYf4N2EPCUaiBRTmzti',
    contractUri: 'ipfs://QmV265QT1CwVg4dCctsY2Ue9hGRRvgGmyKYh6GXURC1coH',
    pendingTokenUri: 'ipfs://QmXsg116NWjuMDUdHXRDN9fj5Vvf1BN8GY6LrQXy9BB9d6',
    salePrice: ether('0.02'),
    preSalePrice: ether('0.02'),
  },
};

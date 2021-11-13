const { ether } = require('@openzeppelin/test-helpers');
module.exports = {
  ownerAddress: '0x5Fed9a5024F2904a604107376a458E890d98edFe',
  Octodoodles: {
    name: 'Octodoodles',
    symbol: 'CPI',
    proxyRegistryAddress: '0xf57b2c51ded3a29e6891aba85459d600256cf317',
    maxSupply: '100',
    preSaleSupply: '20',
    maxReservedSupply: '10',
    baseTokenUri:
      'ipfs://bafybeiaorrufpzqgglxdhkl7riib3xwep2k4bj36ybscg3r5lktbspfi4a',
    contractUri:
      'ipfs://bafkreibwo4u7lvm32tvtkrcmdbhu6y2hd5ax6odnt5ex2kkziqei5behvq',
    pendingTokenUri:
      'ipfs://bafkreifrk3mfehkus7hkgcsw252oqqkmgun34qtm74zvjldlz5i5k7b4xa',
    salePrice: ether('0.006'),
    preSalePrice: ether('0.004'),
  },
};

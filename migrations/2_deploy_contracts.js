const Cryptopi = artifacts.require('Cryptopi');

module.exports = function (deployer, network) {
  const config = require(`../config/${network}`);
  deployer.deploy(
    Cryptopi,
    config.Cryptopi.name,
    config.Cryptopi.symbol,
    config.Cryptopi.proxyRegistryAddress,
    config.Cryptopi.maxSupply,
    config.Cryptopi.preSaleSupply,
    config.Cryptopi.maxReservedSupply,
    config.Cryptopi.baseTokenUri,
    config.Cryptopi.contractUri,
    config.Cryptopi.pendingTokenUri,
    config.Cryptopi.salePrice,
    config.Cryptopi.preSalePrice,
    { from: config.ownerAddress }
  );
};

const Octodoodles = artifacts.require('Octodoodles');

const getNetworkConfig = (network) => {
  switch (network) {
    case 'rinkeby':
    case 'rinkeby-fork':
      return require(`../config/rinkeby`);
    case 'live':
    case 'live-fork':
      return require(`../config/live`);
    default:
      return require(`../config/${network}`);
  }
};

module.exports = function (deployer, network) {
  const config = getNetworkConfig(network);
  console.info('Deploying Octodoodles with params: ', config);
  deployer.deploy(
    Octodoodles,
    config.Octodoodles.name,
    config.Octodoodles.symbol,
    config.Octodoodles.proxyRegistryAddress,
    config.Octodoodles.maxSupply,
    config.Octodoodles.preSaleSupply,
    config.Octodoodles.baseTokenUri,
    config.Octodoodles.contractUri,
    config.Octodoodles.pendingTokenUri,
    config.Octodoodles.salePrice,
    config.Octodoodles.preSalePrice,
    { from: config.ownerAddress, gas: 5000000 }
  );
};

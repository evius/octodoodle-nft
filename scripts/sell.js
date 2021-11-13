const { BN } = require('@openzeppelin/test-helpers');

const Web3 = require('web3');
const { OpenSeaPort, Network } = require('opensea-js');
const MnemonicWalletSubprovider =
  require('@0x/subproviders').MnemonicWalletSubprovider;
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc');
const Web3ProviderEngine = require('web3-provider-engine');

const mnemonic = process.env.MNEMONIC;

const ownerAddress = '0x10e1B58176a29C20E955ec6Db2f45b86Df0fCB60';

module.exports = async (callback) => {
  try {
    const BASE_DERIVATION_PATH = `44'/60'/0'/0`;

    const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
      mnemonic: mnemonic,
      baseDerivationPath: BASE_DERIVATION_PATH,
    });

    const infuraRpcSubprovider = new RPCSubprovider({
      rpcUrl: `https://polygon-mainnet.infura.io/v3/e97bdf381bf64c71a893c6c889e443a0`,
    });

    const providerEngine = new Web3ProviderEngine();
    providerEngine.addProvider(mnemonicWalletSubprovider);
    providerEngine.addProvider(infuraRpcSubprovider);
    providerEngine.start();

    const seaport = new OpenSeaPort(
      providerEngine,
      {
        networkName: Network.Main,
      },
      (arg) => console.log(arg)
    );

    const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24);

    const tokenAddress = '0x2FD7EcB85c2DA1834293c62383C76311166A821F';

    for (let i = 1; i <= 1000; i++) {
      console.info('Selling: ', i);
      const listing = await seaport.createSellOrder({
        asset: {
          tokenId: i,
          tokenAddress,
        },
        accountAddress: ownerAddress,
        startAmount: 0.02,
      });
      console.info(`Result: ${i}`, listing);
    }

    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

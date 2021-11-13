const { BN } = require('@openzeppelin/test-helpers');

const Octodoodles = artifacts.require('Octodoodles');

const ownerAddress = '0x10e1B58176a29C20E955ec6Db2f45b86Df0fCB60';

module.exports = async (callback) => {
  try {
    const instance = await Octodoodles.deployed();
    const tokenURI = await instance.tokenURI(new BN('1'));
    console.info('Token URI: ', tokenURI);
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

const { BN } = require('@openzeppelin/test-helpers');

const Octodoodles = artifacts.require('Octodoodles');

const ownerAddress = '0x10e1B58176a29C20E955ec6Db2f45b86Df0fCB60';

module.exports = async (callback) => {
  try {
    const instance = await Octodoodles.deployed();
    await instance.setPendingTokenURI(
      'ipfs://QmXsg116NWjuMDUdHXRDN9fj5Vvf1BN8GY6LrQXy9BB9d6'
    );
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

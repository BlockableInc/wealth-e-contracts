const contract = require('truffle-contract');
// const WealthECrowdsale = artifacts.require('./WealthECrowdsale.sol');
const WealthE = artifacts.require("./WealthE.sol");
// const TimelockArtifact = artifacts.require("./TokenTimelock.sol");

let token;
// let crowdsale;
// let timelock;

module.exports = async function(callback) {
    token = await WealthE.deployed();
    // crowdsale = await WealthECrowdsale.deployed();
    // timelock = await TimelockArtifact.deployed();

    await token.pause();
    await token.transferOwnership('0x4de203840484767a4ba972c202e835cc23fb14d2');
    // await crowdsale.setTimelockAddress(timelock.address);
    // await crowdsale.claimTimelockOwnership();
}
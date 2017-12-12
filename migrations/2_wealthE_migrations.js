var WealthE = artifacts.require("./WealthE.sol");
var WealthECrowdsale = artifacts.require("./WealthECrowdsale.sol");

module.exports = async function(deployer) {
  await deployer.deploy(WealthE);
  deployer.deploy(WealthECrowdsale, WealthE.address);
};

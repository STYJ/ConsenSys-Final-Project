// No need to deploy Ownable unless you need a standalone contract.
var UserRegistry = artifacts.require("./UserRegistry.sol");

module.exports = function(deployer) {
  deployer.deploy(UserRegistry);
};

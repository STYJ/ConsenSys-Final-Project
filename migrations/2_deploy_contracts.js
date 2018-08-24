// No need to deploy Ownable unless you need a standalone contract.
var UserRegistryStorage = artifacts.require("./contracts/UserRegistryStorage.sol");
var UserRegistryLogic = artifacts.require("./contracts/UserRegistryLogic.sol");

// First deploy UserRegistryStorage
// Then deploy UserRegistryLogic
// Then get instance of UserRegistryStorage
// Then run updateLogicAddress.

module.exports = function(deployer) {
  deployer.deploy(UserRegistryStorage).then(function() {
  	  return deployer.deploy(UserRegistryLogic, UserRegistryStorage.address).then(function() {
  	  	return UserRegistryStorage.deployed().then(function(instance) {
  	  		return instance.updateLogicAddress(UserRegistryLogic.address);
  	  	})
  	  })
	}
  );
};


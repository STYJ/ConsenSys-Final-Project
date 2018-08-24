Please read this file on your text editor instead of on github!


    ___          _                 ___      _   _                       ___          _     _                 
   /   \___  ___(_) __ _ _ __     / _ \__ _| |_| |_ ___ _ __ _ __      /   \___  ___(_)___(_) ___  _ __  ___ 
  / /\ / _ \/ __| |/ _` | '_ \   / /_)/ _` | __| __/ _ \ '__| '_ \    / /\ / _ \/ __| / __| |/ _ \| '_ \/ __|
 / /_//  __/\__ \ | (_| | | | | / ___/ (_| | |_| ||  __/ |  | | | |  / /_//  __/ (__| \__ \ | (_) | | | \__ \
/___,' \___||___/_|\__, |_| |_| \/    \__,_|\__|\__\___|_|  |_| |_| /___,' \___|\___|_|___/_|\___/|_| |_|___/
                   |___/                                                                                     

I will be going through the following patterns:
	1. Access Restriction
	2. Guard Check
	3. State Machine + Emergency Stop
	4. Factory
	5. Eternal Storage
	6. Tight Variable Packing / Memory Array Building

More patterns can be found here! (https://github.com/fravoll/solidity-patterns)

######################
# Access Restriction #
######################

I've implemented the Access Restriction pattern but creating A LOT of modifiers to restrict access from different groups of users (e.g. users with without identities, users who are not approved). The reason for implementing this pattern is because your identity information stored on the blockchain is meant to be highly confidential. Nobody should be able to access them (yes, I know they can just use a block explorer equivalent to view them but that's a different problem entirely regarding privacy). Instead of leaving my variables as public or internal, I've made sure that all the important ones are private. This ensures that nobody else can create a malicious contract to manipulate the storage data on my contract (through inheritance or simply just calling them).

###############
# Guard Check #
###############

I've implemented the Guard Check pattern to ensure that my input parameters are valid. This is to ensure that my Dapp functions can work accordingly e.g. retriving an IPFS image hash must always be of length 46 otherwise you cannot retrieve the file from IPFS. 

####################################
# State Machine and Emergency Stop #
####################################

I've implemented an emergency stop pattern (which overlaps with the state machine pattern) which allows the owner of the contract to pause the contract in the event of a bug. Most of the functions that alters the storage cannot work when the contract is inactive. Some view functions are also disabled for security reasons. Additionally, I've also implemented my own variant of selfdestruct (whereby ether that are sent to my terminated contract will be reverted instead of lost).

###########
# Factory #
###########

I did not implement the factory pattern because I did not see the benefits of using contracts to represent my users instead of a struct. Additionally, there are quite a number of downsides to using contracts to represent my users for instance, contracts are exposed and can be accessed by anyone in a public blockchain. The replicated contracts must replicate code because every contract must contain logic for setting and altering values. On top of that, accessing contracts are more expensive than a simple sload opcode. In the end, all you're getting is higher gas costs with benefits that don't impact my usecase (therefore equivalent to not much benefits) so that's why I've opted not to use it.

###################
# Eternal Storage #
###################

I've implemented my own variant of an eternal storage whereby I split my contract into 2 contracts, one for storage and one for logic. The storage contract contains all the necessary variables and very getters and setters. All business logic related contract are stored on the logic contract. Users will interact with the logic contract which stores the address of the storage contract (this address can be changed by the owner). As an added layer of security, only the defined address (in the storage contract) representing the logic contract can make calls to it. Any other contract trying to access the storage contract will be rejected as it doesn't match the logic address. Again, this address can be changed by the owner in the event a new logic contract is implemented.

##################################################
# Tight Variable Packing / Memory Array Building #
##################################################

I've opted to keep my solidity code simple to read and understand instead of trying to optimise gas costs. While my contract uses a lot of strings (which could be replaced by statically sized bytes instead for more optimisation) however, I felt that the potential of bugs cropping up from having to resort to programming via assembly or optimisation, that is not worth the trade off. At the end of the day, I feel that security should always be the most important because after all, you are only as strong as your weakest link. One simple bug can completely ruin your smart contract. 
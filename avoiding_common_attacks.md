"Explain what measures they’ve taken 
to ensure that their contracts are not susceptible to 
common attacks"

There are a number of notable common attacks that have been described in detail on the consensys github website (https://consensys.github.io/smart-contract-best-practices/known_attacks/). I will be going through each and every one of the attacks, describing how (if applicable) I have tried to prevent these attacks.

  _______                             __         _   _             _        
 |__   __|                           / _|       | | | |           | |       
    | |_   _ _ __   ___  ___    ___ | |_    __ _| |_| |_ __ _  ___| | _____ 
    | | | | | '_ \ / _ \/ __|  / _ \|  _|  / _` | __| __/ _` |/ __| |/ / __|
    | | |_| | |_) |  __/\__ \ | (_) | |   | (_| | |_| || (_| | (__|   <\__ \
    |_|\__, | .__/ \___||___/  \___/|_|    \__,_|\__|\__\__,_|\___|_|\_\___/
        __/ | |                                                             
       |___/|_|                                                                                                                               

###################
# Race conditions #
###################

	a - Reentrancy attacks

		Reentrancing attacks may occur when you give control of your contract to an external (and potentially malicious) contract through means like msg.sender.call.value()() or through callcode / delegatecode. 

		To prevent a reentrancy attack, I've ensured that none of my functions hand over control of my storage to another untrusted external contract. While my Dapp does not deal with ether, there is a payable fallback function in the event someone tries to send ether to my contract. There are also no withdraw functions other than a custom made selfdestruct function which can only be called by the owner.

	b - Cross-function race conditions

		Cross-function race conditions may occur when you have multiple functions that alter the same state. When control of storage is given back to a malicious contract, it can call another function before the internal state of the vicim contract is updated.

		While I have multiple functions that have the ability to change the state of some storage variables, these functions do not hand the control over to an untrusted external calling contract (similar to the previous point) so there should not be an incident where a function of my contract is being called multiple times before the internal storage of my contract is updated (this is not possible by design since I made sure that control is alaways with my contracts and that I always update internal state first.)

	c - Pitfalls in race condition solutions

		Pitfalls in race condition solutions occur when you're calling one of your untrusted functions (which calls an untrusted external contract) too soon. 

		To prevent this from happening, I made sure that none of my functions interact with any untrusted external contracts and to ensure that the internal storage of my contract is always updated before an external contract call (regardless of whether it's trusted or not).

##################################
# Trasaction-Ordering Dependence #
##################################

	This problem is related to the order of transactions in a block. 

	To prevent this attack from happening, I ensured that the functions in my contract are not dependent on the ordering of the other functions. Additionally, every function has its own unique role to play, with no function being able to do more than 1 thing (e.g. there is no function that allows the user to do both update details followed by approving a requester together).

###################
# Time dependence #
###################

	This problem is related to when your business logic is dependent on the time of the block (as it can be manipulated by miners). 
	
	To prevent this attack from happening, I ensured that my functions do not rely on the timestamp of blocks to help with my business logic / validation / verification.

##########################
# Integer over/underflow #
##########################

	This problem is related to integers and floats and how these types are able to "wrap" around (similar to that of word wrap) if the number gets too big or too small. 

	For some reference, the only place in my function that uses numbers are the maximum length of a name (20 character), the possible options for the hash of an IPFS hash (46 characters or 0 character) and the maximum size of the pendingApproval array (size of 10). The constants cannot be changed and I've designed my functions in a way to prevent integer over/underflow from occuring e.g. len cannot be reduced until an address is removed from the array.

################################
# DoS with (unexpected) revert #
################################

	This problem is related to handing control over to an external contract as a malicious contract might intentionally revert in their fallback function, preventing the function in my contract from executing successfully thereby making it impossible for any state changes in the contract. 

	To prevent this from happening, I made sure that I only hand control of my contract over to trusted external contracts. There is also no withdraw function in the event ether is accidentally sent to my contract (other than a custom selfdestruct function that only the owner can call).

############################
# DoS with Block Gas Limit #
############################

	This problem is related to a malicious actor intentionally causing one of my contract's function to not work properly because of the built in block gas limit for each Ethereum block. 

	To prevent this attack from happening, I've ensured that any string that I require will be of length 20 and below (with the exception of my IPFS Hash which will be either be 46 characters long or 0). Additionally, I have a function that allows user to request for approval (from another user to view their data) and a corresponding data structure to store it. This data structure has a maximum size of 10 so a malicious actor cannot spam this array with addresses to prevent my Dapp from retrieving a list of addresses that are pending approval. When the cap is hit, nobody else can request for approval until the previous ones have been approved / unapproved. 

########################################
# Forcibly Sending Ether to a Contract #
########################################

	This problem is one related to using the ethereum balance of a contract as part of some business logic validation. Even a fallback function with revert will not be able to stop malicious actors from sending ether to a contract (via selfdestruct to precomputation of the contract's address and sending ether there before the contract is deployed). 

	In order to prevent this attack, I made sure that none of my functions require using the balance of my contract for any validation. Instead, I added many modifiers as access control to ensure only the desired group of users can use the functions that are allocated to them. 

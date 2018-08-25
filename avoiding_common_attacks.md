Please read this file on your text editor instead of on github!

There are a number of notable common attacks that have been described in detail on the consensys github website (https://consensys.github.io/smart-contract-best-practices/known_attacks/). I will be going through each and every one of the attacks, describing how (if applicable) I have tried to prevent these attacks.

 _____                                __     _   _   _             _        
/__   \_   _ _ __   ___  ___    ___  / _|   /_\ | |_| |_ __ _  ___| | _____ 
  / /\/ | | | '_ \ / _ \/ __|  / _ \| |_   //_\\| __| __/ _` |/ __| |/ / __|
 / /  | |_| | |_) |  __/\__ \ | (_) |  _| /  _  \ |_| || (_| | (__|   <\__ \
 \/    \__, | .__/ \___||___/  \___/|_|   \_/ \_/\__|\__\__,_|\___|_|\_\___/
       |___/|_|                                                                                                                                                 
###################
# Race conditions #
###################

	a - Reentrancy attacks

		To prevent a reentrancy attack, I've ensured that none of my functions hand over control of my storage to another untrusted external contract. While my Dapp does not deal with ether, there is a payable fallback function in the event someone tries to send ether to my contract. There are also no withdraw functions other than a custom made selfdestruct function which can only be called by the owner. Additionally, I've implemented an extra layer of protection to ensure that my storage contract can only be called by the address of the logic contract specified in it (which can be changed by the owner). This means that no other contracts can interact interact with it.

	b - Cross-function race conditions

		While I have multiple functions that have the ability to change the state of some storage variables, these functions do not hand the control over to an untrusted external calling contract (similar to the previous point) so there should not be an incident where a function of my contract is being called multiple times before the internal storage of my contract is updated (this is not possible by design since I made sure that control is alaways with my contracts and that only the address of the logic contract specified in the storage contract can interact with the storage. I also always update internal state first.)

	c - Pitfalls in race condition solutions

		To prevent this from happening, I made sure that none of my functions interact with any untrusted external contracts and to ensure that the internal storage of my contract is always updated before an external contract call (regardless of whether it's trusted or not).

##################################
# Trasaction-Ordering Dependence #
##################################

	To prevent this attack from happening, I ensured that the functions in my contract are not dependent on the ordering of the other functions. There are many guards put in place for every function to ensure that it cannot be run until a certain condition is hit. Additionally, every function has its own unique role to play, with no function being able to do more than 1 thing (e.g. there is no function that allows the user to do both update details followed by approving a requester together).

###################
# Time dependence #
###################
	
	To prevent this attack from happening, I ensured that my functions do not rely on the timestamp of blocks to help with my business logic / validation / verification.

##########################
# Integer over/underflow #
##########################

	For some reference, the only place in my function that uses numbers are the maximum length of a name (20 character), the possible options for the hash of an IPFS hash (46 characters or 0 character) and the maximum size of the pendingApproval array (size of 5). The constants cannot be changed and I've designed my functions in a way to prevent integer over/underflow from occuring e.g. len cannot be reduced until an address is removed from the array.

################################
# DoS with (unexpected) revert #
################################


	To prevent this from happening, I made sure that I only hand control of my contract over to trusted external contracts. There is also no withdraw function in the event ether is accidentally sent to my contract (other than a custom selfdestruct function that only the owner can call). Additionally, I implemented a logic in my storage contract that allows only the specified address of the logic contract to interact with it. Any other contracts who try to interact with it will fail.

############################
# DoS with Block Gas Limit #
############################

	To prevent this attack from happening, I've ensured that any string that I require will be of length 20 and below (with the exception of my IPFS Hash which will be either be 46 characters long or 0). Additionally, the array used to store approval requests has a maximum size of 5 to ensure that it'll always be below the maximum gas limit of a block. (I think you can go up higher but I left it as 5 for testing purposes.)

########################################
# Forcibly Sending Ether to a Contract #
######################################## 

	In order to prevent this attack, I made sure that none of my functions require using the balance of my contract for any validation. Instead, I added many modifiers as access control to ensure only the desired group of users can use the functions that are allocated to them.

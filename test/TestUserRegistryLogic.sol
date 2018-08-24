pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/UserRegistryLogic.sol";

contract TestUserRegistryLogic {

	/************/
	/* Approach */
	/************/

	// I will be testing that every function and modifier are working correctly and that the correct events are emitted. Both pass (+) and fail (-) scenarios will be described here. I will be testing both UserRegistryLogic and UserRegistryStorage contracts via the UserRegistryLogic smart contract.

	/* createUser function */
	// (-) Test that an identity cannot be created if the name is greater than length 20
	// (-) Test that an identity cannot be created if the imageHash is not of length 0 or 46
	// (+) Test that an identity can be successfully created
	// (+) Test that a UserCreated event is emitted
	// (-) Test that the same address cannot create another identity


	/* getMyIdentity function */
	// (-) Test that an identity cannot be retrieve if it doesn't exist
	// (+) Test that an identity can be successfully retrieved


	/* isRegistered function */
	// (+) Test that an identity's registration status can be successfully retrieved.


	/* updateName function */
	// (-) Test that an identity cannot be updated if it doesn't exist
	// (-) Test that an identity cannot be created if the name is greater than length 20
	// (+) Test that the name can be updated
	// (+) Test that the NameUpdated event is emitted


	/* updateImageHash function */
	// (-) Test that an identity cannot be updated if it doesn't exist
	// (-) Test that an identity cannot be created if the imageHash is not of length 0 or 46
	// (+) Test that the imageHash can be updated
	// (+) Test that the ImageUpdated event is emitted


	/* updateNameAndImage function */
	// (+) Test that the name and image can be updated together
	// (+) Test NameUpdated and ImageUpdated events are emitted


	/* getApprovalRequest function */
	// (-) Test that the approval requests for identity cannot be retrieve if it doesn't exist
	// (+) Test that the user can retrieve a list of approval requests


	/* requestForApproval function */
	// (-) Test that a request cannot be made from a requestee to himself
	// (-) Test that a request cannot be made if the requestee (the one being requested) doesn't have an identity
	// (-) Test that a request cannot be made if the requester doesn't have an identity
	// (+) Test that a request can be successfully requested
	// (+) Test that a RequestingForApproval event is emitted
	// (-) Test that a request cannot be made if the user has requested previously
	// (-) Test that a request cannot be made if the requestee has reached the maximum number of requests (ARRAY_MAX_SIZE)


	/* removeRequest function */
	// (-) Test that a request cannot be removed from a requestee to himself
	// (-) Test that a request cannot be removed if the requestee (the one being requested) doesn't have an identity
	// (-) Test that a request cannot be removed if the requester doesn't have an identity
	// (+) Test that a request can be successfully removed
	// (+) Test that a RemoveRequestForApproval event is emitted
	// (-) Test that a request cannot be removed if the requstee has reached the minimum number of requests (0)


	/* getRequesterApprovalStatus function */
	// (-) Test that the requestee cannot get make a request to get approval status to himself
	// (-) Test that a request to get approval status cannot be made if the requestee (the one being requested) doesn't have an identity
	// (-) Test that a request to get approval status cannot be made if the requester doesn't have an identity
	// (+) Test that a request to get approval status can be successfully retrieved


	/* approveRequester function */
	// (-) Test that a request cannot be approved from a requestee to himself
	// (-) Test that a request cannot be approved if the requester doesn't have an identity
	// (-) Test that a request cannot be approved if the requestee (the one being requested) doesn't have an identity
	// (+) Test that a request can be successfully approved
	// (+) Test that a RequesterApproved event is emitted
	// (+) Test that the number of approval requests have been reduced by 1

	/* unapproveRequester function */
	// (-) Test that a request cannot be rejected from a requestee to himself
  	// (-) Test that a request cannot be rejected if the requester doesn't have an identity
	// (-) Test that a request cannot be rejected if the requestee (the one being requested) doesn't have an identity
	// (+) Test that a request can be successfully rejected
	// (+) Test that a RequesterUnapproved event is emitted
	// (+) Test that the number of approval requests have been reduced by 1

	
	/* getIdentityFrom function */
	// (-) Test that the requestee cannot make a request to get identity to himself
	// (-) Test that a request to get identity cannot be made if the requestee (the one being requested) doesn't have an identity
	// (-) Test that a request to get identity cannot be made if the requester doesn't have an identity
	// (-) Test that a request to get identity cannot be made if the requester is not approved by the requestee.
	// (+) Test that a request to get identity can be successfully made.


	/* toggleContractActive */
	// (+) Test that contract can be paused and that all the above functions that have been appended with the stopInEmergency() modifier cannot be run if the contract is paused.


	/* terminateContractPermanently function */
	// (+) Test that the contract can be terminated permanently, the owner is renounced, the balance of the contract is withdrawn to the now renounced owner and that all of the above functions that have been appended with the contractAlive() modifier cannot be run if the contract is terminated permanently.

}

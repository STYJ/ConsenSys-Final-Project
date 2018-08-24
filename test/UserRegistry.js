const UserRegistry = artifacts.require('UserRegistry')

contract('UserRegistry', function(accounts) {

    // Note that because of the way I structured my tests (in 1 contract), the output of 1 tests will be fed into the next test as input.

	const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const june = accounts[3]
    const simon = accounts[4]
    const james = accounts[5]
    const may = accounts[6]
    const monty = accounts[7]
    const toby = accounts[8]

    const ownerImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581Vz"
    const aliceImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581V1"
    const bobImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r58122"
    const juneImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r58333"
    const simonImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r54444"
    const jamesImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r55555"
    const mayImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5666666"
    const montyImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y7777777"
    const tobyImage = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo6488888888"

    it("Testing the pass and fail scenarios for createUser function", async() => {
        const userRegistry = await UserRegistry.deployed()
     
        const nameTooLong = "HelloMyNameIsTooLongToBeAccepted"
        const imageHashIncorrect = "ABCDEF"
        const imageHashIncorrectAgain = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581VzABCDEFG"
        const name = "owner"
        const imageHash = ownerImage

        // Try to create an identity whose name is too long, should throw an error
        try {
			await userRegistry.createUser(nameTooLong, imageHash, {from: owner})
			// If await passes, throw an assert fail
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to create an identity whose imageHash length is not 0, should throw an error
        try {
			await userRegistry.createUser(name, imageHashIncorrect, {from: owner})
			// If await passes, throw an assert fail
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to create an identity whose imageHash length is not 46, should throw an error
        try {
			await userRegistry.createUser(name, imageHashIncorrectAgain, {from: owner})
			// If await passes, throw an assert fail
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to create an identity successfully with a valid name and imageHash and that the UserCreated event is emitted
        var Event = userRegistry.UserCreated()
        var userAddress;
        var eventName = '';
        var eventEmitted = false

        // Wrapping the event watch in a promise has worked consistently to watch events and get logged data
        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            userAddress = res.args.userAddress
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })


        try {
			await userRegistry.createUser(name, imageHash, {from: owner})
			await checkForEvent
	    	assert.equal(userAddress, owner, 'the userAddress (' + userAddress + ') in the event does not match the expected value of ' + owner + ' when the user identity is created in the contract ')
	    	assert.equal(eventEmitted, true, 'Creating a user identity should emit an event.')
	    	assert.equal(eventName, "UserCreated", 'Creating a user identity should emit a UserCreated event')
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
		
        // Try to create an identity when an identity has already been created, should throw an error
        try {
			await userRegistry.createUser(name, imageHash, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })


    it("Testing the pass and fail scenarios for getMyIdentity function", async() => {
        const userRegistry = await UserRegistry.deployed()
     
        const name = "alice"
        const imageHash = aliceImage

        // Try to get an identity that doesn't exist, should throw an error
        try {
			await userRegistry.getMyIdentity({from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to create an identity successfully and try to retrieve it.
        await userRegistry.createUser(name, imageHash, {from: alice})

        try {
	        const result = await userRegistry.getMyIdentity({from: alice})
			assert.equal(result[0], name, "The name of the identity created does not match the expected name.")
			assert.equal(result[1], imageHash, "The image hash of the identity created does not match the expected image hash.")
		} catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}
		
    })


    it("Testing the pass scenario for isRegistered function", async() => {
        const userRegistry = await UserRegistry.deployed()

        // Try to get the registration status of alice and bob successfully
        try {
	        let aliceResult = await userRegistry.isRegistered(alice, {from: alice});
	        let bobResult = await userRegistry.isRegistered(bob, {from: bob});

	        // Asserting that alice's identity exists
			assert.equal(aliceResult, true, "The registration status of a previously created identity does not match the expected registration status.")
			// Asserting that bob's identity does not exist
			assert.equal(bobResult, false, "The registration status of an address that has never created an identity does not match the expected registration status.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}
    })


    it("Testing the pass and fail scenarios for updateName function", async() => {
        const userRegistry = await UserRegistry.deployed()
		
		const name = "bob"
        const expectedNewName = "alice two"
        const newNameTooLong = "IHaveAVeryLongNameAndItStartsWithAlice"

        // Try to update the name of an identity that doesn't exist, should throw an error
        try {
			await userRegistry.updateName(name, {from: bob})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update the name of an identity with a name that's longer than 20, should throw an error
        try {
			await userRegistry.updateName(newNameTooLong, {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update the name of an identity successfully and that the NameUpdated event is emitted.
        var Event = userRegistry.NameUpdated()
        var expectedOldName = "alice"
        var eventName = '';
        var eventEmitted = false
        var oldName = '';
        var newName = '';

        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            oldName = res.args.oldName
            newName = res.args.newName
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })

        try {
        	await userRegistry.updateName(expectedNewName, {from: alice})
        	await checkForEvent
        	assert.equal(oldName, expectedOldName, "The old name of the identity emitted in the event does not match the expected old name.")
	    	assert.equal(newName, expectedNewName, "The updated name of the identity created does not match the expected new name.")
	    	assert.equal(eventEmitted, true, "Updating an identity's name should emit an event.")
	    	assert.equal(eventName, "NameUpdated", "Updating an identity's name should emit a NameUpdated event.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })


    it("Testing the pass and fail scenarios for updateImageHash function", async() => {
        const userRegistry = await UserRegistry.deployed()
		
		const newImageHashWrongLength = "WrongLength"
        const expectedNewImageHash = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r58111"

        // Try to update the image hash of an identity that doesn't exist, should throw an error
        try {
			await userRegistry.updateImageHash(bobImage, {from: bob})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update the image hash of an identity with a hash of length not equal to 0 or 46, should throw an error
        try {
			await userRegistry.updateImageHash(newImageHashWrongLength, {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update the image hash of an identity successfully and that the ImageUpdated event is emitted.
        var Event = userRegistry.ImageUpdated()
        var expectedOldImageHash = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581V1"
        var eventName = '';
        var eventEmitted = false
        var oldImageHash = '';
        var newImageHash = '';

        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            oldImageHash = res.args.oldImageHash
            newImageHash = res.args.newImageHash
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })

        try {
        	await userRegistry.updateImageHash(expectedNewImageHash, {from: alice})
        	await checkForEvent
        	assert.equal(oldImageHash, expectedOldImageHash, "The old image hash of the identity emitted in the event does not match the expected old image hash.")
	    	assert.equal(newImageHash, expectedNewImageHash, "The updated image hash of the identity created does not match the expected new image hash.")
	    	assert.equal(eventEmitted, true, "updating an identity's image should emit an event.")
	    	assert.equal(eventName, "ImageUpdated", "Updating an identity's image should emit a ImageUpdated event.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass scenarios for updateNameAndImage function", async() => {
        const userRegistry = await UserRegistry.deployed()

        const expectedNewName = "alice"
        const expectedNewImageHash = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581V1"
		

        // Try to update the name and image hash of an identity successfully and that the NameUpdated and ImageUpdated events is emitted.
        var nameEvent = userRegistry.NameUpdated()
        var imageEvent = userRegistry.ImageUpdated()
        var expectedOldName = "alice two"
        var expectedOldImageHash = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r58111"
        var nameEventName = '';
        var nameEventEmitted = false
        var imageEventName = '';
        var imageEventEmitted = false
        var oldName = '';
        var newName = '';
        var oldImageHash = '';
        var newImageHash = '';

        let checkForNameEvent = new Promise((resolve, reject) => {
          nameEvent.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            oldName = res.args.oldName
            newName = res.args.newName
            nameEventName = res.event
            nameEventEmitted = true
            nameEvent.stopWatching()
            resolve(res)
          })
        })

        let checkForImageEvent = new Promise((resolve, reject) => {
          imageEvent.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            oldImageHash = res.args.oldImageHash
            newImageHash = res.args.newImageHash
            imageEventName = res.event
            imageEventEmitted = true
            imageEvent.stopWatching()
            resolve(res)
          })
        })

        try {
        	await userRegistry.updateNameAndImage(expectedNewName, expectedNewImageHash, {from: alice})
        	await checkForNameEvent
        	assert.equal(oldName, expectedOldName, "The old name of the identity emitted in the event does not match the expected old name.")
	    	assert.equal(newName, expectedNewName, "The updated name of the identity created does not match the expected new name.")
	    	assert.equal(nameEventEmitted, true, "Updating an identity's name should emit an event.")
	    	assert.equal(nameEventName, "NameUpdated", "Updating an identity's name should emit a NameUpdated event.")

	    	await checkForImageEvent
        	assert.equal(oldImageHash, expectedOldImageHash, "The old image hash of the identity emitted in the event does not match the expected old image hash.")
	    	assert.equal(newImageHash, expectedNewImageHash, "The updated image hash of the identity created does not match the expected new image hash.")
	    	assert.equal(imageEventEmitted, true, "Updating an identity's image should emit an event.")
	    	assert.equal(imageEventName, "ImageUpdated", "Updating an identity's image should emit a ImageUpdated event.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass and fail scenarios for getApprovalRequests function", async() => {
    	const userRegistry = await UserRegistry.deployed()
		
    	// Try to get approval requests for an identity that doesn't exist, should throw an error
    	try {
			await userRegistry.getApprovalRequests({from: bob})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to get the approval requests for an identity that exists
    	var expectedApprovalRequestsArray = "0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
    	var expectedNumApprovalRequests = 0


        try {
        	const result = await userRegistry.getApprovalRequests({from: alice})
        	assert.equal(result[0], expectedApprovalRequestsArray, "The approval requests array does not match the expected approval requests array.")
	    	assert.equal(result[1], expectedNumApprovalRequests, "The number of approval requests does not match the expected number of approval requests.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass and fail scenarios for requestForApproval function", async() => {
    	const userRegistry = await UserRegistry.deployed()
		
    	// Try to make a request for approval by a requestee to a himself, should throw an error
    	try {
			await userRegistry.requestForApproval(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to make a request for approval to a requestee that doesn't exist, should throw an error
    	try {
			await userRegistry.requestForApproval(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }


    	// Try to make a request for approval to a requester that doesn't exist, should throw an error
    	try {
			await userRegistry.requestForApproval(owner, {from: bob})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to make a request for approval successfully and that the RequestingForApproval event is emitted

        var Event = userRegistry.RequestingForApproval()
        var expectedApprovalRequestsArray = alice + ",0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
    	var expectedNumApprovalRequests = 1
        var eventName = '';
        var eventEmitted = false
        var requestee = ''
        var expectedRequestee = owner
        var requester = ''
        var expectedRequester = alice


        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            requestee = res.args.requestee
            requester = res.args.requester
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })


        try {
        	await userRegistry.requestForApproval(owner, {from: alice})
        	await checkForEvent
        	const result = await userRegistry.getApprovalRequests({from: owner})
        	assert.equal(result[0], expectedApprovalRequestsArray, "The approval requests array does not match the expected approval requests array.")
	    	assert.equal(result[1], expectedNumApprovalRequests, "The num of approval requests does not match the expected num of approval requests.")
	    	assert.equal(eventEmitted, true, "Requesting for approval should emit an event.")
	    	assert.equal(eventName, "RequestingForApproval", "Requesting for an approval request should emit a RequestForApproval event.")
	    	assert.equal(requestee, expectedRequestee, "The requestee emitted in the event does not match the expected requestee.")
	    	assert.equal(requester, expectedRequester, "The requester emitted in the event does not match the expected requester.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to make another request for approval even though a request has been made previously, should throw an error
    	try {
			await userRegistry.requestForApproval(owner, {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to make a request for approval when the maximum number of requests (5 to make testing easier but in my actual DApp, it's 10) has been reached, should throw an error

    	// Create 5 more accounts to test this.
    	await userRegistry.createUser('bob', bobImage, {from: bob})
    	await userRegistry.createUser('june', juneImage, {from: june})
    	await userRegistry.createUser('simon', simonImage, {from: simon})
    	await userRegistry.createUser('james', jamesImage, {from: james})
    	await userRegistry.createUser('may', mayImage, {from: may})

    	await userRegistry.requestForApproval(owner, {from: bob})
    	await userRegistry.requestForApproval(owner, {from: june})
    	await userRegistry.requestForApproval(owner, {from: simon})
    	await userRegistry.requestForApproval(owner, {from: james})

    	try {
			await userRegistry.requestForApproval(owner, {from: may})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })
	
	it("Testing the pass and fail scenarios for removeRequest function", async() => {
    	const userRegistry = await UserRegistry.deployed()
		
    	// Try to remove a request for approval from a requestee to a himself, should throw an error
    	try {
			await userRegistry.removeRequest(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    	// Try to remove a request for approval from a requestee that doesn't exist, should throw an error
    	try {
			await userRegistry.removeRequest(owner, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }


    	// Try to remove a request for approval from a requester that doesn't exist, should throw an error
    	try {
			await userRegistry.removeRequest(monty, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to remove a request for approval successfully and that a RemoveRequestForApproval event is emitted
        var Event = userRegistry.RemoveRequestForApproval()
        var expectedApprovalRequestsArray = james + "," + bob + "," + june + "," + simon + ",0x0000000000000000000000000000000000000000"
    	var expectedNumApprovalRequests = 4
        var eventName = '';
        var eventEmitted = false
        var requestee = ''
        var expectedRequestee = owner
        var requester = ''
        var expectedRequester = alice

        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            requestee = res.args.requestee
            requester = res.args.requester
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })

        try {
        	await userRegistry.removeRequest(alice, {from: owner})
        	await checkForEvent
        	const result = await userRegistry.getApprovalRequests({from: owner})
        	assert.equal(result[0], expectedApprovalRequestsArray, "The approval requests array does not match the expected approval requests array.")
	    	assert.equal(result[1], expectedNumApprovalRequests, "The num of approval requests does not match the expected num of approval requests.")
	    	assert.equal(eventEmitted, true, "Removing an approval request should emit an event.")
	    	assert.equal(eventName, "RemoveRequestForApproval", "Removing an approval request should emit a RemoveRequestForApproval event.")
	    	assert.equal(requestee, expectedRequestee, "The requestee emitted in the event does not match the expected requestee.")
	    	assert.equal(requester, expectedRequester, "The requester emitted in the event does not match the expected requester.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Test that a request cannot be removed if the requestee has reached the minimum number of requests (0), should throw an error

        await userRegistry.removeRequest(bob, {from: owner})
    	await userRegistry.removeRequest(june, {from: owner})
    	await userRegistry.removeRequest(simon, {from: owner})
    	await userRegistry.removeRequest(james, {from: owner})

    	try {
			await userRegistry.removeRequest(may, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

	it("Testing the pass scenario for getApprovalRequestStatus function", async() => {
        const userRegistry = await UserRegistry.deployed()

        // Try to get approval request status from a requestee to himself, should throw an error
        try {
			await userRegistry.getRequesterApprovalStatus(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get approval request status from a requestee who doesn't have an identity, should throw an error
        try {
			await userRegistry.getRequesterApprovalStatus(owner, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get approval request status from a requester who doesn't an an identity, should throw an error
        try {
			await userRegistry.getRequesterApprovalStatus(monty, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get approval request status successfully from a valid requestee and requester
        try {
			const result = await userRegistry.getRequesterApprovalStatus(alice, {from: owner})
			assert.equal(result, false, "The requester approval status retrieved does not match the expected requester approval status.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    })

    it("Testing the pass and fail scenarios for approveRequester function", async() => {
        const userRegistry = await UserRegistry.deployed()
        // Try to approve a requester from a requestee to himself, should throw an error
        try {
			await userRegistry.approveRequester(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to approve a requester who doesn't have an identity, should throw an error
        try {
			await userRegistry.approveRequester(monty, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to approve a requester from a requestee who doesn't have an identity, should throw an error
        try {
			await userRegistry.approveRequester(owner, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }


        // Try to approve a requester from a requestee successfully, that the RequesterApproved event is emitted and that the number of approval requests has been reduced by 1

        await userRegistry.requestForApproval(owner, {from: alice})

        // Try to update the image hash of an identity successfully and that the ImageUpdated event is emitted.
        var Event = userRegistry.RequesterApproved()
        var expectedApprovalStatus = true
        var expectedApprovalRequestsArray = "0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
        var expectedNumApprovalRequests = 0;
        var eventName = '';
        var eventEmitted = false
        var requester = '';
        var expectedRequester = alice;
        var requestee = '';
        var expectedRequestee = owner;

        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            requestee = res.args.requestee
            requester = res.args.requester
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })

        try {
			await userRegistry.approveRequester(alice, {from: owner})
			await checkForEvent

			const approvalStatus = await userRegistry.getRequesterApprovalStatus(alice, {from: owner})
			assert.equal(approvalStatus, expectedApprovalStatus, "The requester approval status retrieved does not match the expected requester approval status.")

			assert.equal(eventEmitted, true, "Approving a requester should emit an event.")
	    	assert.equal(eventName, "RequesterApproved", "Approving a request should emit a RequesterApproved event.")
	    	assert.equal(requestee, expectedRequestee, "The requestee emitted in the event does not match the expected requestee.")
	    	assert.equal(requester, expectedRequester, "The requester emitted in the event does not match the expected requester.")

			const result = await userRegistry.getApprovalRequests({from: owner})
        	assert.equal(result[0], expectedApprovalRequestsArray, "The approval requests array does not match the expected approval requests array.")
	    	assert.equal(result[1], expectedNumApprovalRequests, "The num of approval requests does not match the expected num of approval requests.")


        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass and fail scenarios for unapproveRequester function", async() => {
        const userRegistry = await UserRegistry.deployed()
        // Try to unapprove a requester from a requestee to himself, should throw an error
        try {
			await userRegistry.unapproveRequester(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to unapprove a requester who doesn't have an identity, should throw an error
        try {
			await userRegistry.unapproveRequester(monty, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to unapprove a requester from a requestee who doesn't have an identity, should throw an error
        try {
			await userRegistry.unapproveRequester(owner, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }


        // Try to unapprove a requester from a requestee successfully, that the RequesterUnapproved event is emitted and that the number of approval requests has been reduced by 1

        await userRegistry.requestForApproval(owner, {from: bob})

        // Try to update the image hash of an identity successfully and that the ImageUpdated event is emitted.
        var Event = userRegistry.RequesterUnapproved()
        var expectedApprovalStatus = false
        var expectedApprovalRequestsArray = "0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000"
        var expectedNumApprovalRequests = 0;
        var eventName = '';
        var eventEmitted = false
        var requester = '';
        var expectedRequester = bob;
        var requestee = '';
        var expectedRequestee = owner;

        let checkForEvent = new Promise((resolve, reject) => {
          Event.watch(async function(err, res) {
            if (err) {
              reject(err)
            }
            // Get logged data.
            requestee = res.args.requestee
            requester = res.args.requester
            eventName = res.event
            eventEmitted = true
            Event.stopWatching()
            resolve(res)
          })
        })

        try {
			await userRegistry.unapproveRequester(bob, {from: owner})
			await checkForEvent

			const approvalStatus = await userRegistry.getRequesterApprovalStatus(bob, {from: owner})
			assert.equal(approvalStatus, expectedApprovalStatus, "The requester approval status retrieved does not match the expected requester approval status.")

			assert.equal(eventEmitted, true, "Approving a requester should emit an event.")
	    	assert.equal(eventName, "RequesterUnapproved", "Approving a request should emit a RequesterApproved event.")
	    	assert.equal(requestee, expectedRequestee, "The requestee emitted in the event does not match the expected requestee.")
	    	assert.equal(requester, expectedRequester, "The requester emitted in the event does not match the expected requester.")

			const result = await userRegistry.getApprovalRequests({from: owner})
        	assert.equal(result[0], expectedApprovalRequestsArray, "The approval requests array does not match the expected approval requests array.")
	    	assert.equal(result[1], expectedNumApprovalRequests, "The num of approval requests does not match the expected num of approval requests.")


        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass and fail scenarios for getIdentityFrom function", async() => {
        const userRegistry = await UserRegistry.deployed()
        // Try to get identity of a requestee from himself, should throw an error
        try {
			await userRegistry.getIdentityFrom(owner, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get identity of a requestee who doesn't have an identity, should throw an error
        try {
			await userRegistry.getIdentityFrom(monty, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get an identity of a requestee from a requester who doesn't have an identity, should throw an error
        try {
			await userRegistry.getIdentityFrom(owner, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get an identity of a requstee from a requester who is not approved, should throw an error
        try {
			await userRegistry.getIdentityFrom(owner, {from: bob})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get an identity of a requestee from a requester who is approved
        try {
			const result = await userRegistry.getIdentityFrom(owner, {from: alice})
			assert.equal(result[0], 'owner', "The name of the identity created does not match the expected name.")
			assert.equal(result[1], ownerImage, "The image hash of the identity created does not match the expected image hash.")
			
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

    it("Testing the pass scenarios for toggleContractActive function", async() => {
        const userRegistry = await UserRegistry.deployed()

        // Need this step to prep additional data.
        await userRegistry.requestForApproval(owner, {from: bob})

        // Try to pause the contract by toggling the contract to inactive, all functions marked with onlyInEmergency should throw an error
        await userRegistry.toggleContractActive({from: owner})

        // Trying to create a user, should throw an error
        try {
			await userRegistry.createUser("monty", montyImage, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Trying to get my identity, should work as per normal
        try {
	        const result = await userRegistry.getMyIdentity({from: alice})
			assert.equal(result[0], 'alice', "The name of the identity created does not match the expected name.")
			assert.equal(result[1], aliceImage, "The image hash of the identity created does not match the expected image hash.")
		} catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}

		// Trying to get registration status, should work as per normal
		try {
	        let aliceResult = await userRegistry.isRegistered(alice, {from: alice});
	        // Asserting that alice's identity exists
			assert.equal(aliceResult, true, "The registration status of a previously created identity does not match the expected registration status.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}

		// Try to update name, should throw an error
		try {
			await userRegistry.updateName("new name", {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update image hash, should throw an error
        try {
			await userRegistry.updateImageHash('', {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update name and image hash, should throw an error
        try {
			await userRegistry.updateNameAndImage("new name", '', {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get approval requests array, should throw an error
        try {
        	const result = await userRegistry.getApprovalRequests({from: alice})
        	assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to request for approval, should throw an error
        try {
			await userRegistry.requestForApproval(owner, {from: june})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to remove a request, should throw an error
        try {
			await userRegistry.removeRequest(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get requester approval status, should work as per normal
        try {
			const result = await userRegistry.getRequesterApprovalStatus(alice, {from: owner})
			assert.equal(result, true, "The requester approval status retrieved does not match the expected requester approval status.")
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to approve requester, should throw an error
        try {
			await userRegistry.approveRequester(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to unapprove requester, should throw an error
        try {
			await userRegistry.unapproveRequester(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get identity from a requestee, should work as intended.
        try {
			const result = await userRegistry.getIdentityFrom(owner, {from: alice})
			assert.equal(result[0], 'owner', "The name of the identity created does not match the expected name.")
			assert.equal(result[1], ownerImage, "The image hash of the identity created does not match the expected image hash.")
			
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

    })

    it("Testing the pass scenarios for toggleContractActive function", async() => {
        const userRegistry = await UserRegistry.deployed()

        await userRegistry.toggleContractActive({from: owner})

        // Try to pause the contract by toggling the contract to inactive, all functions marked with onlyInEmergency should throw an error
        await userRegistry.terminateContractPermanently({from: owner})

        // Trying to create a user, should throw an error
        try {
			await userRegistry.createUser("monty", montyImage, {from: monty})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Trying to get my identity, should throw an error
        try {
	        const result = await userRegistry.getMyIdentity({from: alice})
			assert.fail('Expected revert not received');
		} catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}

		// Trying to get registration status, should throw an error
		try {
	        let aliceResult = await userRegistry.isRegistered(alice, {from: alice});
	    	assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
		}

		// Try to update name, should throw an error
		try {
			await userRegistry.updateName("new name", {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update image hash, should throw an error
        try {
			await userRegistry.updateImageHash('', {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to update name and image hash, should throw an error
        try {
			await userRegistry.updateNameAndImage("new name", '', {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get approval requests array, should throw an error
        try {
        	const result = await userRegistry.getApprovalRequests({from: alice})
        	assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to request for approval, should throw an error
        try {
			await userRegistry.requestForApproval(owner, {from: june})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to remove a request, should throw an error
        try {
			await userRegistry.removeRequest(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get requester approval status, should throw an error
        try {
			const result = await userRegistry.getRequesterApprovalStatus(alice, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to approve requester, should throw an error
        try {
			await userRegistry.approveRequester(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to unapprove requester, should throw an error
        try {
			await userRegistry.unapproveRequester(bob, {from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to get identity from a requestee, should throw an error
        try {
			const result = await userRegistry.getIdentityFrom(owner, {from: alice})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }

        // Try to pause the contract, should throw an error
        try {
			const result = await userRegistry.toggleContractActive({from: owner})
			assert.fail('Expected revert not received');
        } catch (error) {
        	const revertFound = error.message.search('revert') >= 0;
        	assert(revertFound, `Expected "revert", got ${error} instead`);
        }
    })

});

pragma solidity ^0.4.24;
import "./Ownable.sol";
import "./strings.sol";
import "./UserRegistryStorage.sol";

contract UserRegistryLogic is Ownable {
    using strings for *;

    // Constants
    uint constant MAX_LEN = 20;
    uint constant IPFS_LEN = 46;
    uint constant ARRAY_MAX_SIZE = 5;
    
    // Configs
    address private dataStoreAddress;
    UserRegistryStorage private dataStore;

    // Contract status
    bool private active;
    bool private contractTerminated;
    
    // Events
    event LogDeposit(address indexed sender);
    event dataStoreAddressAddressUpdated(
        address indexed oldDataStoreAddress,
        address indexed newDataStoreAddress
    );
    event ActiveStatusToggled(bool indexed oldStatus, bool indexed newStatus);
    event ContractTerminatedPermanently();
    event UserCreated(address indexed userAddress);
    event NameUpdated(string oldName, string newName);
    event ImageUpdated(string oldImageHash, string newImageHash);
    event RequestingForApproval(
        address indexed requestee,
        address indexed requester
    );
    event RemoveRequestForApproval(
        address indexed requestee,
        address indexed requester
    );
    event RequesterApproved(
        address indexed requestee,
        address indexed requester
    );
    event RequesterUnapproved(
        address indexed requestee,
        address indexed requester
    );
    
    // Modifiers
    modifier identityDoesNotExist(address _address) {
        require(!dataStore.getRequesteeExists(_address));
        _;
    }
    
    modifier identityExists(address _address) {
        require(dataStore.getRequesteeExists(_address));
        _;
    }
    
    modifier isApproved(address _requester, address _requestee) {
        require(dataStore.getRequesterPermission(_requestee, _requester));
        _;
    }
    
    modifier requesterIsNotRequestee(address _requester, address _requestee) {
        require(_requester != _requestee);
        _;
    }
    
    modifier maxStringLength(string str) {
        require(str.toSlice().len() <= MAX_LEN);
        _;
    }
    
    modifier ipfsHashLength(string _imageHash) {
        uint length = _imageHash.toSlice().len();
        require(length == IPFS_LEN || length == 0);
        _;
    }
    
    modifier stopInEmergency() {
        require(active);
        _;
    }
    
    modifier contractAlive() {
        require(!contractTerminated);
        _;
    }

    // Utility functions
    constructor(address _dataStoreAddress) Ownable() public {
        active = true;
        contractTerminated = false;
        dataStoreAddress = _dataStoreAddress;
        dataStore = UserRegistryStorage(dataStoreAddress);
    }

    function () public payable contractAlive() {
        // Fallback payable function to accept ether
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }

    function toggleContractActive() public contractAlive() onlyOwner() {
        // To pause a function in the event of a bug
        active = !active;
        emit ActiveStatusToggled(!active, active);
    }
    
    function terminateContractPermanently()
        public
        contractAlive()
        onlyOwner()
    {
        // To completely terminate the function (similar to selfdestruct)
        contractTerminated = true;
        owner.transfer(address(this).balance);
        renounceOwnership();
        emit ContractTerminatedPermanently();
    }
    
    function updateDataStore (address _dataStoreAddress) public onlyOwner() {
        // Update the data store contract address
        address oldDataStoreAddress = dataStoreAddress;
        dataStoreAddress = _dataStoreAddress;
        dataStore = UserRegistryStorage(dataStoreAddress);
        emit dataStoreAddressAddressUpdated(
            oldDataStoreAddress,
            dataStoreAddress
        );
    }

    // Identity Dapp functions
    function createUser(string _name, string _imageHash)
        public
        contractAlive()
        stopInEmergency()
        identityDoesNotExist(msg.sender)
        maxStringLength(_name)
        ipfsHashLength(_imageHash)
    {
        // Sets name, imageHash and exists to true.
        dataStore.setRequesteeName(msg.sender, _name);
        dataStore.setRequesteeImageHash(msg.sender, _imageHash);
        dataStore.setRequesteeExists(msg.sender, true);
        emit UserCreated(msg.sender);
    }

    function updateName(string _name)
        public
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        maxStringLength(_name)
    {
        // Update identity with new name
        string memory name = dataStore.getRequesteeName(msg.sender);
        dataStore.setRequesteeName(msg.sender, _name);
        emit NameUpdated(name, _name);
    }
    
    function updateImageHash(string _imageHash)
        public
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        ipfsHashLength(_imageHash)
    {
        // Update identity with new image hash
        string memory imageHash = dataStore.getRequesteeImageHash(msg.sender);
        dataStore.setRequesteeImageHash(msg.sender, _imageHash);
        emit ImageUpdated(imageHash, _imageHash);
    }
    
    function updateNameAndImage(string _name, string _imageHash)
        public
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        maxStringLength(_name)
        ipfsHashLength(_imageHash)
    {
        // Update identity with new name and image hash
        string memory name;
        string memory imageHash;
        (name, imageHash) = getMyIdentity();
        updateName(_name);
        updateImageHash(_imageHash);
        emit NameUpdated(name, _name);
        emit ImageUpdated(imageHash, _imageHash);
    }

    function requestForApproval(address _requestee)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(msg.sender, _requestee)
        identityExists(msg.sender)
        identityExists(_requestee)
    {        
        // Requesting for approval to view someone else's identity
        // First guard checks if the max number of approval requests is hit
        require(
            dataStore.getRequesteeNumAddresses(_requestee) < ARRAY_MAX_SIZE
        );
        
        // Second guard checks if requester requested previously
        uint index = dataStore.getRequesterPendingApprovalIndex(
            _requestee,
            msg.sender
        );
        require(dataStore.getRequesteePendingApproval(
            _requestee)[index] != msg.sender
        );
        
        // If both guards pass, get index and store into pendingApproval array
        index = dataStore.getRequesteeNumAddresses(_requestee);
        dataStore.setRequesteePendingApproval(_requestee, msg.sender, index);
        dataStore.setRequesterPendingApprovalIndex(
            _requestee,
            msg.sender,
            index
        );
        dataStore.setRequesteeNumAddresses(
            _requestee,
            dataStore.getRequesteeNumAddresses(_requestee) + 1
        );
        emit RequestingForApproval(_requestee, msg.sender);
    }
    
    function removeRequest(address _requester)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(_requester)
        identityExists(msg.sender)
    {
        // Remove a requester's request for approval
        // First guard checks if the min number of approval requests is hit
        require(dataStore.getRequesteeNumAddresses(msg.sender) > 0);
        
        // Second guard checks if requester's request exists
        uint index = dataStore.getRequesterPendingApprovalIndex(
            msg.sender,
            _requester
        );
        if(dataStore.getRequesteePendingApproval(
            msg.sender
        )[index] == _requester) {

            // Replace the request to be removed with the last request
            // then reduce the array size by 1
            uint lastIndex =
                dataStore.getRequesteeNumAddresses(msg.sender) - 1;
            address lastAddress = dataStore.getRequesteePendingApproval(
                msg.sender
            )[lastIndex];
            dataStore.setRequesteePendingApproval(
                msg.sender,
                lastAddress,
                index
            );
            dataStore.setRequesterPendingApprovalIndex(
                msg.sender,
                lastAddress,
                index
            );
            dataStore.deleteRequesteePendingApproval(msg.sender, lastIndex);
            dataStore.setRequesteeNumAddresses(
                msg.sender,
                dataStore.getRequesteeNumAddresses(msg.sender) - 1
            );
            emit RemoveRequestForApproval(msg.sender, _requester);
        }
    }

    function approveRequester(address _requester)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(msg.sender)
        identityExists(_requester)
    {
        // Approve a requester to view your identity
        dataStore.setRequesterPermission(msg.sender, _requester, true);
        emit RequesterApproved(msg.sender, _requester);
        removeRequest(_requester);
    }
    
    function unapproveRequester(address _requester)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(msg.sender)
        identityExists(_requester)
    {
        // Revoke a requester's ability to view your identity
        dataStore.setRequesterPermission(msg.sender, _requester, false);
        emit RequesterUnapproved(msg.sender, _requester);
        removeRequest(_requester);
    }

    // Helper functions 
    function isRegistered(address _address)
        public
        view
        contractAlive()
        returns (bool)
    {
        // Get the registration status of an address
        return dataStore.getRequesteeExists(_address);
    }

    function getMyIdentity()
        public
        view
        contractAlive()
        identityExists(msg.sender)
        returns (string, string)
    {
        // Get the name and image hash of msg.sender
        return (
            dataStore.getRequesteeName(msg.sender),
            dataStore.getRequesteeImageHash(msg.sender)
        );

    }
    
    function getApprovalRequests()
        public
        view
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        returns (address[ARRAY_MAX_SIZE], uint)
    {
        // Get an array of approval requests from msg.sender
        return (
            dataStore.getRequesteePendingApproval(msg.sender),
            dataStore.getRequesteeNumAddresses(msg.sender)
        );
    }

    function getRequesterApprovalStatus(address _requester)
        public
        view
        contractAlive()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(msg.sender)
        identityExists(_requester)
        returns (bool)
    {
        // Get a requester's approval status from msg.sender
        return dataStore.getRequesterPermission(msg.sender, _requester);
    }

    function getIdentityFrom(address _requestee)
        public
        view
        contractAlive()
        requesterIsNotRequestee(msg.sender, _requestee)
        identityExists(msg.sender)
        identityExists(_requestee)
        isApproved(msg.sender, _requestee)
        returns (string, string)
    {
        // Get a requestee's identity
        return (dataStore.getRequesteeName(_requestee),
            dataStore.getRequesteeImageHash(_requestee)
        );
    }
}

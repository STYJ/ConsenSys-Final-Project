pragma solidity ^0.4.24;
import "./Ownable.sol";
import "./strings.sol";
import "./UserRegistryStorage.sol";

// can create a user registry handler that does the instantiation of this contract
contract UserRegistryLogic is Ownable {
    using strings for *;
    
    
    uint constant MAX_LEN = 20;
    uint constant IPFS_LEN = 46;
    uint constant ARRAY_MAX_SIZE = 5;
    
    
    address private dataStoreAddress;
    UserRegistryStorage private dataStore;
    bool private active;
    bool private contractTerminated;
    
    event LogDeposit(address indexed sender);
    event dataStoreAddressAddressUpdated(address indexed oldDataStoreAddress, address indexed newDataStoreAddress);
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

        
    
    
    
    
    
    
    constructor(address _dataStoreAddress) Ownable() public {
        active = true;
        contractTerminated = false;
        dataStoreAddress = _dataStoreAddress;
        dataStore = UserRegistryStorage(dataStoreAddress);
    }
    
    function updateDataStore (address _dataStoreAddress) public onlyOwner() {
        address oldDataStoreAddress = dataStoreAddress;
        dataStoreAddress = _dataStoreAddress;
        dataStore = UserRegistryStorage(dataStoreAddress);
        emit dataStoreAddressAddressUpdated(oldDataStoreAddress, dataStoreAddress);
    }

    function createUser(string _name, string _imageHash)
        public
        contractAlive()
        stopInEmergency()
        identityDoesNotExist(msg.sender)
        maxStringLength(_name)
        ipfsHashLength(_imageHash)
    {
        dataStore.setRequesteeExists(msg.sender, true);
        dataStore.setRequesteeName(msg.sender, _name);
        dataStore.setRequesteeImageHash(msg.sender, _imageHash);
        emit UserCreated(msg.sender);
    }

    function getMyIdentity()
        public
        view
        contractAlive()
        identityExists(msg.sender)
        returns (string, string)
    {
        return (dataStore.getRequesteeName(msg.sender), dataStore.getRequesteeImageHash(msg.sender));

    }
    
    function isRegistered(address _address)
        public
        view
        contractAlive()
        returns (bool)
    {
        return dataStore.getRequesteeExists(_address);
    }

    function updateName(string _name)
        public
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        maxStringLength(_name)
    {
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
        string memory name;
        string memory imageHash;
        (name, imageHash) = getMyIdentity();
        updateName(_name);
        updateImageHash(_imageHash);
        emit NameUpdated(name, _name);
        emit ImageUpdated(imageHash, _imageHash);
    }

    function getApprovalRequests()
        public
        view
        contractAlive()
        stopInEmergency()
        identityExists(msg.sender)
        returns (address[ARRAY_MAX_SIZE], uint)
    {
        return (
            dataStore.getRequesteePendingApproval(msg.sender),
            dataStore.getRequesteeNumAddresses(msg.sender)
        );
    }

    function requestForApproval(address _requestee)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(msg.sender, _requestee)
        identityExists(msg.sender)
        identityExists(_requestee)
    {        
        // Check that max number hasn't been hit.
        require(dataStore.getRequesteeNumAddresses(_requestee) < ARRAY_MAX_SIZE);
        
        // Check that requestor hasn't requested previously.
        uint index = dataStore.getRequesterPendingApprovalIndex(_requestee, msg.sender); // will default to 0 if uninitialized
        require(dataStore.getRequesteePendingApproval(_requestee)[index] != msg.sender);
        
        // Since the index in pendingApproval is not the requestor, get new index
        index = dataStore.getRequesteeNumAddresses(_requestee);
        dataStore.setRequesteePendingApproval(_requestee, msg.sender, index);
        dataStore.setRequesterPendingApprovalIndex(_requestee, msg.sender, index);
        dataStore.setRequesteeNumAddresses(_requestee, dataStore.getRequesteeNumAddresses(_requestee) + 1);
        emit RequestingForApproval(_requestee, msg.sender);
    }
    
    // msg.sender = requestee
    function removeRequest(address _requester)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(_requester)
        identityExists(msg.sender)
    {
        
        // Check that the min num hasn't been hit
        require(dataStore.getRequesteeNumAddresses(msg.sender) > 0);
        
        // Check that the requestor exists
        uint index = dataStore.getRequesterPendingApprovalIndex(msg.sender, _requester);
        if(dataStore.getRequesteePendingApproval(msg.sender)[index] == _requester) {

            // Replace last address with the requestor's index from pendingApproval, update index mapping then remove last index
            uint lastIndex = dataStore.getRequesteeNumAddresses(msg.sender) - 1;
            address lastAddress = dataStore.getRequesteePendingApproval(msg.sender)[lastIndex];
            dataStore.setRequesteePendingApproval(msg.sender, lastAddress, index);
            dataStore.setRequesterPendingApprovalIndex(msg.sender, lastAddress, index);
            
            // delete last index and reduce size
            dataStore.deleteRequesteePendingApproval(msg.sender, lastIndex);
            dataStore.setRequesteeNumAddresses(msg.sender, dataStore.getRequesteeNumAddresses(msg.sender) - 1);
        
            emit RemoveRequestForApproval(msg.sender, _requester);
        }
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
        return dataStore.getRequesterPermission(msg.sender, _requester);
    }
 
    function approveRequester(address _requester)
        public
        contractAlive()
        stopInEmergency()
        requesterIsNotRequestee(_requester, msg.sender)
        identityExists(msg.sender)
        identityExists(_requester)
    {
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
        dataStore.setRequesterPermission(msg.sender, _requester, false);
        emit RequesterUnapproved(msg.sender, _requester);
        removeRequest(_requester);
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
        return (dataStore.getRequesteeName(_requestee), dataStore.getRequesteeImageHash(_requestee));
    }

    function toggleContractActive() public contractAlive() onlyOwner() {
        active = !active;
        emit ActiveStatusToggled(!active, active);
    }
    
    function terminateContractPermanently() public contractAlive() onlyOwner() {
        contractTerminated = true;
        owner.transfer(address(this).balance);
        renounceOwnership();
        emit ContractTerminatedPermanently();
    }
    
    // Fallback function for accepting ether, no way of withdrawing.
    function () public payable contractAlive() {
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }

    // From requestee to requester
    // function approveMultipleRequesters(address[ARRAY_MAX_SIZE] _requesters) public contractAlive() stopInEmergency() {
    //     for (uint i = 0; i < _requesters.length - 1; i++){
    //         if(_requesters[i] != address(0)) {
    //             approveRequester(_requesters[i]);
    //         }
    //     }
    // }

    // From requestee to requester
    // function unapproveMultipleRequesters(address[ARRAY_MAX_SIZE] _requesters) public contractAlive() stopInEmergency() {
    //     for (uint i = 0; i < _requesters.length - 1; i++){
    //         if(_requesters[i] != address(0)){
    //             unapproveRequester(_requesters[i]);
    //         }
    //     }
    // }

}

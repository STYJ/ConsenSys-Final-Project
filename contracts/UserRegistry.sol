pragma solidity ^0.4.24;
import "./Ownable.sol";
import "./strings.sol";

contract UserRegistry is Ownable { // can create a user registry handler that does the instantiation of this contract
    
    using strings for *;
    
    // Get the basics out first
    // Eventually you can work on additional identities
    
    struct User {
        bool exists;
        mapping(address => bool) permissions;
        
        string name;
        string imageHash; 
        
        address[ARRAY_MAX_SIZE] pendingApproval; // used to keep track of what is the mapping
        uint numAddresses;
        mapping(address => uint) index;
    }
    
    uint constant MAX_LEN = 20;
    uint constant IPFS_LEN = 46;
    uint constant ARRAY_MAX_SIZE = 10;
    mapping(address => User) private users;
    bool private active;
    bool private contractTerminated;

    event LogDeposit(address indexed sender);
    event UserCreated(address indexed userAddress);
    event RequestingForApproval(address indexed requestee, address indexed requester);
    event RemoveRequestForApproval(address indexed requestee, address indexed requester);
    event RequesterApproved(address indexed requestee, address indexed requester);
    event RequesterUnapproved(address indexed requestee, address indexed requester);
    event NameUpdated(string indexed oldName, string indexed newName);
    event ImageUpdated(string indexed oldImageHash, string indexed newImageHash);
    
    modifier identityDoesNotExist(address _address) { 
        require(!users[_address].exists);
        _;
    }
    
    modifier identityExists(address _address) {
        require(users[_address].exists);
        _;
    }
    
    modifier isApproved(address _requester, address _requestee) {
        require(users[_requestee].permissions[_requester]);
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

    constructor() Ownable() public {
        active = true;
        contractTerminated = false;
    }
    
        
    function toggleContractActive() public contractAlive() onlyOwner() {
        active = !active;
    }
    
    function terminateContractPermanently() public contractAlive() onlyOwner() {
        contractTerminated = true;
        owner.transfer(address(this).balance);
        renounceOwnership();
    }
    
    function createUser(string _name, string _imageHash) public contractAlive() stopInEmergency() identityDoesNotExist(msg.sender) maxStringLength(_name) ipfsHashLength(_imageHash) {
        users[msg.sender].exists = true;
        users[msg.sender].name = _name;
        users[msg.sender].imageHash = _imageHash;
        emit UserCreated(msg.sender);
    }
        
    // From requester to requestee
    function requestForApproval(address _requestee) public contractAlive() stopInEmergency() requesterIsNotRequestee(msg.sender, _requestee) identityExists(msg.sender) identityExists(_requestee) {
        
        // Check that max number hasn't been hit.
        require((users[_requestee].numAddresses + 1) <= ARRAY_MAX_SIZE);
        
        // Check that requestor hasn't requested previously.
        uint index = users[_requestee].index[msg.sender]; // will default to 0 if uninitialized
        require(users[_requestee].pendingApproval[index] != msg.sender);
        
        // Since the index in pendingApproval is not the requestor, get new index
        index = users[_requestee].numAddresses;
        users[_requestee].pendingApproval[index] = msg.sender;
        users[_requestee].index[msg.sender] = index;
        users[_requestee].numAddresses ++;
        
        emit RequestingForApproval(_requestee, msg.sender);
    }
    
    // From requestee to requester
    function removeRequest(address _requester) public contractAlive() stopInEmergency() requesterIsNotRequestee(_requester, msg.sender) identityExists(_requester) identityExists(msg.sender) {
        
        // Check that the min num hasn't been hit
        require((users[msg.sender].numAddresses - 1) >= 0);
        
        // Check that the requestor exists
        uint index = users[msg.sender].index[_requester];
        require(users[msg.sender].pendingApproval[index] == _requester);
        
        // Replace last address with the requestor's index from pendingApproval, update index mapping then remove last index
        uint lastIndex = users[msg.sender].numAddresses - 1;
        address lastAddress = users[msg.sender].pendingApproval[lastIndex];
        users[msg.sender].pendingApproval[index] = lastAddress;
        users[msg.sender].index[lastAddress] = index;
        
        // delete last index and reduce size
        delete users[msg.sender].pendingApproval[lastIndex];
        users[msg.sender].numAddresses --;

        emit RemoveRequestForApproval(msg.sender, _requester);
    }
 
    // From requestee to requester
    function approveRequester(address _requester) public contractAlive() stopInEmergency() requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) {
        users[msg.sender].permissions[_requester] = true;
        emit RequesterApproved(msg.sender, _requester);
        removeRequest(_requester);
    }
    
    // From requestee to requester
    function unapproveRequester(address _requester) public contractAlive() stopInEmergency() requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) {
        users[msg.sender].permissions[_requester] = false;
        emit RequesterUnapproved(msg.sender, _requester);
        removeRequest(_requester);
    }
    
        
    function getApprovalRequests() public view contractAlive() stopInEmergency() returns (address[ARRAY_MAX_SIZE], uint) {
        return (users[msg.sender].pendingApproval, users[msg.sender].numAddresses);
    }

    // From requestee to requester
    function getRequesterApprovalStatus(address _requester) public view contractAlive() requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) returns (bool) { 
        return users[msg.sender].permissions[_requester];
    }

    // From requester to requestee
    function getIdentityFrom(address _requestee) public view contractAlive() requesterIsNotRequestee(msg.sender, _requestee) identityExists(msg.sender) identityExists(_requestee) isApproved(msg.sender, _requestee) returns (string, string) {
        return (users[_requestee].name, users[_requestee].imageHash);
    }

    // From reuqestee to requestee
    function getMyIdentity() public view contractAlive() identityExists(msg.sender) returns (string, string) {
        return (users[msg.sender].name, users[msg.sender].imageHash);
    }
    

    function isRegistered(address _address) public view contractAlive() returns (bool) {
        return users[_address].exists;
    }

    function updateName(string _name) public contractAlive() stopInEmergency() identityExists(msg.sender) maxStringLength(_name) {
        string memory name = users[msg.sender].name;
        users[msg.sender].name = _name;
        emit NameUpdated(name, _name);
    }
    
    function updateImageHash(string _imageHash) public contractAlive() stopInEmergency() identityExists(msg.sender) ipfsHashLength(_imageHash) {
        string memory imageHash = users[msg.sender].imageHash;
        users[msg.sender].imageHash = _imageHash;
        emit NameUpdated(imageHash, _imageHash);
    }
    
    function updateNameAndImage(string _name, string _imageHash) public contractAlive() stopInEmergency() identityExists(msg.sender) maxStringLength(_name) ipfsHashLength(_imageHash) {
        string memory name;
        string memory imageHash;
        (name, imageHash) = getMyIdentity();
        users[msg.sender].name = _name;
        users[msg.sender].imageHash = _imageHash;
        emit NameUpdated(name, _name);
        emit ImageUpdated(imageHash, _imageHash);
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

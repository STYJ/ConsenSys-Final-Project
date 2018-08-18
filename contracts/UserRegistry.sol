pragma solidity ^0.4.24;
import "./Ownable.sol";

contract UserRegistry is Ownable { // can create a user registry handler that does the instantiation of this contract
    
    // Get the basics out first
    // Eventually you can work on additional identities
    // and one time approval vs many times approval.
    
    struct User {
        bool exists;
        mapping(address => bool) permissions;
        mapping(address => bool) pendingApproval;
        string name; // todo: limit length of name and imageHash (must be 46 characters)
        string imageHash; 
    }
    
    mapping(address => User) private users; 

    event LogDeposit(address indexed sender);
    event UserCreated(address indexed userAddress);
    event RequestingForApproval(address indexed requestee, address indexed requester);
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


    constructor() Ownable() public {
    }
        

    function createUser(string _name, string _imageHash) public identityDoesNotExist(msg.sender) {
        users[msg.sender] = User({exists: true, name: _name, imageHash: _imageHash});
        emit UserCreated(msg.sender);
    }
        
    // From requester to requestee
    function requestForApproval(address _requestee) public requesterIsNotRequestee(msg.sender, _requestee) identityExists(msg.sender) identityExists(_requestee) {
        users[_requestee].pendingApproval[msg.sender] = true;
        emit RequestingForApproval(_requestee, msg.sender);
    }
    
    // From requestee to requester
    function approveRequester(address _requester) public requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) {
        users[msg.sender].pendingApproval[_requester] = false;
        users[msg.sender].permissions[_requester] = true;
        emit RequesterApproved(msg.sender, _requester);
    }
    
    // From requestee to requester
    function unapproveRequester(address _requester) public requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) {
        users[msg.sender].permissions[_requester] = false;
        emit RequesterUnapproved(msg.sender, _requester);
    }
    
    // From requestee to requester
    function getRequesterApprovalStatus(address _requester) public view requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) identityExists(_requester) returns (bool) { 
        return users[msg.sender].permissions[_requester];
    }

    // From requester to requestee
    function getIdentityFrom(address _requestee) public view requesterIsNotRequestee(msg.sender, _requestee) identityExists(msg.sender) identityExists(_requestee) isApproved(msg.sender, _requestee) returns (string, string) {
        return (users[_requestee].name, users[_requestee].imageHash);
    }

    // From reuqestee to requestee
    function getMyIdentity() public view identityExists(msg.sender) returns (string, string) {
        return (users[msg.sender].name, users[msg.sender].imageHash);
    }
    

    // Utility functions
    function isRegistered(address _address) public view returns (bool) {
        return users[_address].exists;
    }

    function updateName(string _name) public identityExists(msg.sender) {
        string memory name = users[msg.sender].name;
        users[msg.sender].name = _name;
        emit NameUpdated(name, _name);
    }
    
    function updateImageHash(string _imageHash) public identityExists(msg.sender) {
        string memory imageHash = users[msg.sender].imageHash;
        users[msg.sender].imageHash = _imageHash;
        emit NameUpdated(imageHash, _imageHash);
    }
    
    function updateNameAndImage(string _name, string _imageHash) public identityExists(msg.sender) {
        string memory name;
        string memory imageHash;
        (name, imageHash) = getMyIdentity();
        users[msg.sender].name = _name;
        users[msg.sender].imageHash = _imageHash;
        emit NameUpdated(name, _name);
        emit ImageUpdated(imageHash, _imageHash);
        
    }

    
    
    // Fallback function for accepting ether, no way of withdrawing.
    function () public payable {
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }
    
}

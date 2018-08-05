pragma solidity ^0.4.24;
import "./Ownable.sol";

contract UserRegistry is Ownable { // can create a user registry handler that does the instantiation of this contract
    
    // Get the basics out first
    // Eventually you can work on additional identities
    // and one time approval vs many times approval.
    
    struct User {
        bool exists;
        mapping(address => bool) permissions;
        string nameHash;
        string imageHash;
    }
    
    mapping(address => User) private users; // every user can only have 1 identity?


    event LogDeposit(address indexed sender);
    event UserCreated(address indexed userAddress);
    event RequesterApproved(address indexed requestee, address indexed requester);
    event RequesterUnapproved(address indexed requestee, address indexed requester);

    
    modifier identityDoesNotExist(address _address) { 
        require(!users[_address].exists);
        _;
    }
    
    modifier identityExists(address _address) {
        require(users[_address].exists);
        _;
    }
    
    modifier isRequesterSelf(address _requester) {
        require(msg.sender != _requester);
        _;
    }
    
    modifier isApproved(address _requestee, address _requester) {
        require(users[_requestee].permissions[_requester]);
        _;
    }
    
    modifier requesterIsNotRequestee(address _requester, address _requestee) {
        require(_requester != _requestee);
        _;
    }

    

    constructor() Ownable() public {
        
    }
    

    function createUser(string _nameHash, string _imageHash) public identityDoesNotExist(msg.sender) {
        users[msg.sender] = User({exists: true, nameHash: _nameHash, imageHash: _imageHash});
        emit UserCreated(msg.sender);
    }
    
    function approveRequester(address _requester) public requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) {
        // Is there a need to check that the requester also has an identity?
        users[msg.sender].permissions[_requester] = true;
        emit RequesterApproved(msg.sender, _requester);
    }
    
    function unapproveRequester(address _requester) public requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) {
        // Is there a need to check that the requester also has an identity?
        users[msg.sender].permissions[_requester] = false;
        emit RequesterUnapproved(msg.sender, _requester);
    }
    
    function getRequesterApprovalStatus(address _requester) public view requesterIsNotRequestee(_requester, msg.sender) identityExists(msg.sender) returns (bool) { 
        // Is there a need to check that the requester also has an identity?
        return users[msg.sender].permissions[_requester];
    }
    
    function getMyIdentity() public view identityExists(msg.sender) returns (string, string) {
        return (users[msg.sender].nameHash, users[msg.sender].imageHash);
    }
    
    function getIdentityFrom(address _requestee) public view requesterIsNotRequestee(msg.sender, _requestee) identityExists(_requestee) isApproved(_requestee, msg.sender) returns (string, string) {
        return (users[_requestee].nameHash, users[_requestee].imageHash);
    }
    
    // Fallback function for accepting ether, no way of withdrawing.
    function () public payable {
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }
    
}

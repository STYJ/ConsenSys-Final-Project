pragma solidity ^0.4.24;
import "./Ownable.sol";

contract UserRegistryStorage is Ownable {
    
    struct User {
        bool exists;
        mapping(address => bool) permissions;
        string name;
        string imageHash; 
        address[ARRAY_MAX_SIZE] pendingApproval; 
        uint numAddresses;
        mapping(address => uint) index;
    }
    
    uint constant MAX_LEN = 20;
    uint constant IPFS_LEN = 46;
    uint constant ARRAY_MAX_SIZE = 5;
    
    address private logicAddress;
    mapping(address => User) private users;
    bool private active;
    bool private contractTerminated;

    event LogDeposit(address indexed sender);
    event LogicAddressUpdated(address indexed oldLogicAddress, address indexed newLogicAddress);
    event ActiveStatusToggled(bool indexed oldStatus, bool indexed newStatus);
    event ContractTerminatedPermanently();
    
    modifier onlyFromLogicAddress() {
        require(msg.sender == logicAddress);
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
        
    // Don't forget to do this
    function updateLogicAddress(address _logicAddress) public contractAlive() stopInEmergency() onlyOwner() {
        address oldAddress = logicAddress;
        logicAddress = _logicAddress;
        emit LogicAddressUpdated(oldAddress, _logicAddress);
    }
    
    
    function getRequesteeExists(address requestee) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (bool) {
        return users[requestee].exists;
    }
    
    function setRequesteeExists(address requestee, bool _exists) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].exists = _exists;
    }
    
    function getRequesterPermission(address requestee, address requester) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (bool) {
        return users[requestee].permissions[requester];
    }
    
    function setRequesterPermission(address requestee, address requester, bool permission) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].permissions[requester] = permission;
    }
    
    function getRequesteeName(address requestee) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (string) {
        return users[requestee].name;
    }
    
    function setRequesteeName(address requestee, string _name) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].name = _name;
    }
    
    function getRequesteeImageHash(address requestee) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (string) {
        return users[requestee].imageHash;
    }
    
    function setRequesteeImageHash(address requestee, string _imageHash) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].imageHash = _imageHash;
    }
    
    function getRequesteePendingApproval(address requestee) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (address[ARRAY_MAX_SIZE]) {
        return users[requestee].pendingApproval;
    }

    function deleteRequesteePendingApproval(address requestee, uint index) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        delete users[requestee].pendingApproval[index];
    }
    
    function setRequesteePendingApproval(address requestee, address requester, uint index) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].pendingApproval[index] = requester;   
    }

    
    function getRequesteeNumAddresses(address requestee) public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (uint) {
        return users[requestee].numAddresses;
    }
    
    function setRequesteeNumAddresses(address requestee, uint _numAddresses) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].numAddresses = _numAddresses;
    }
    
    function getRequesterPendingApprovalIndex(address requestee, address requester)  public view contractAlive() stopInEmergency() onlyFromLogicAddress() returns (uint) {
        return users[requestee].index[requester];   
    }
    
    function setRequesterPendingApprovalIndex(address requestee, address requester, uint _index) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        users[requestee].index[requester] = _index;
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
}

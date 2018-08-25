pragma solidity ^0.4.24;
import "./Ownable.sol";

contract UserRegistryStorage is Ownable {

    // Constants
    uint constant MAX_LEN = 20;
    uint constant IPFS_LEN = 46;
    uint constant ARRAY_MAX_SIZE = 5;

    // Configs
    address private logicAddress;

    // Contract status
    bool private active;
    bool private contractTerminated;

    // Data structures
    struct User {
        bool exists;
        mapping(address => bool) permissions;
        string name;
        string imageHash; 
        address[ARRAY_MAX_SIZE] pendingApproval; 
        uint numAddresses;
        mapping(address => uint) index;
    }

    // Variables
    mapping(address => User) private users;

    // Events
    event LogDeposit(address indexed sender);
    event LogicAddressUpdated(
        address indexed oldLogicAddress,
        address indexed newLogicAddress
    );
    event ActiveStatusToggled(bool indexed oldStatus, bool indexed newStatus);
    event ContractTerminatedPermanently();
    
    // Modifiers
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
    
    // Utility functions
    constructor() Ownable() public {
        active = true;
        contractTerminated = false;
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

    function updateLogicAddress(address _logicAddress)
        public
        contractAlive()
        stopInEmergency()
        onlyOwner()
    {
        // Update the logic contract address
        address oldAddress = logicAddress;
        logicAddress = _logicAddress;
        emit LogicAddressUpdated(oldAddress, _logicAddress);
    }
    
    // Setter functions
    function setRequesteeExists(address requestee, bool _exists)
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Set user's existence
        users[requestee].exists = _exists;
    }

    function setRequesterPermission(
        address requestee,
        address requester,
        bool permission
    ) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        // Set requesters' permission to view your details
        users[requestee].permissions[requester] = permission;
    }
    
    function setRequesteeName(address requestee, string _name)
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Set your identity name
        users[requestee].name = _name;
    }

    function setRequesteeImageHash(address requestee, string _imageHash)
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Set your identity image hash
        users[requestee].imageHash = _imageHash;
    }
    
    function setRequesteePendingApproval(
        address requestee,
        address requester,
        uint index
    ) public contractAlive() stopInEmergency() onlyFromLogicAddress() {
        // Add requester's request to requestee's pendingApproval array
        users[requestee].pendingApproval[index] = requester;   
    }

    function deleteRequesteePendingApproval(address requestee, uint index)
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Delete requester's request from requestee's pendingApproval array
        delete users[requestee].pendingApproval[index];
    }

    function setRequesteeNumAddresses(address requestee, uint _numAddresses)
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Set requestee's number of requests for approval
        users[requestee].numAddresses = _numAddresses;
    }

    function setRequesterPendingApprovalIndex(
        address requestee,
        address requester,
        uint _index
    )
        public
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
    {
        // Set requester's request index
        users[requestee].index[requester] = _index;
    }
    
    // Getter functions
    function getRequesteeExists(address requestee)
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (bool)
    {
        // Get user's existence
        return users[requestee].exists;
    }

    function getRequesterPermission(address requestee, address requester)
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (bool)
    {
        // Get requester's permission from requestee
        return users[requestee].permissions[requester];
    }

    function getRequesteeName(address requestee)
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (string)
    {
        // Get your identity's name
        return users[requestee].name;
    }

    function getRequesteeImageHash(address requestee)
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (string)
    {
        // Get your identity's image hash
        return users[requestee].imageHash;
    }

    function getRequesteePendingApproval(address requestee)
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (address[ARRAY_MAX_SIZE])
    {
        // Get your array of approval requests
        return users[requestee].pendingApproval;
    }

    function getRequesteeNumAddresses(address requestee)
        public
        view 
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (uint)
    {
        // Get the number of approval requests
        return users[requestee].numAddresses;
    }

    function getRequesterPendingApprovalIndex(
        address requestee,
        address requester
    ) 
        public
        view
        contractAlive()
        stopInEmergency()
        onlyFromLogicAddress()
        returns (uint)
    {
        // Get requester's approval request index
        return users[requestee].index[requester];   
    }
}

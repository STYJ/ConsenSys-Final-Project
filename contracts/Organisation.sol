pragma solidity ^0.4.24;
import "./Ownable.sol";

contract Organisation is Ownable {
    
    /*********************/
    /** State Variables **/
    /*********************/
    
    // Company Details
    string private companyName = "";
    string private companyId = "";
    bytes private logo = "";   
    
    // Admin details
    mapping(address => Employee) private admins; // Mapping from address to Admin details
    uint32 private numAdmins = 0;
    
    // Employee details
    mapping(address => Employee) private employees; // Mapping from userID to address
    uint32 private numEmployees = 0; 
    
    /*************/
    /** Structs **/
    /*************/
    
    struct Employee {
        bool exists;
        uint32 id; // Employee ID; All should be non zero. 
        string name; // Should this be shared with the organisation?
    }
    
    /************/
    /** Events **/
    /************/
    
    // Misc events
    event OrganisationCreated(string indexed name, string indexed uniqueId, bytes indexed logo);
    event LogDeposit(address _sender);
    event CompanyNameUpdated(string oldName, string newName);
    event CompanyIdUpdated(string oldId, string newId);
    event CompanyLogoUpdated(bytes oldImageHash, bytes newImageHash);
    
    // Admin related events
    event AdminCreated(address indexed adminAddress, uint32 indexed adminId, string indexed adminName);
    event AdminDeactivated(address indexed adminAddress);
    event AdminReactivated(address indexed adminAddress);
    
    // Employee related events
    event EmployeeCreated(address indexed employeeAddress, uint32 indexed employeeId, string indexed employeeName);
    event EmployeeDeactivated(address indexed employeeAddress);
    event EmployeeReactivated(address indexed employeeAddress);
    
    /***************/
    /** Modifiers **/
    /***************/
    
    // Misc modifiers
    modifier onlyOwnerOrAdmins() {
        require(owner == msg.sender || admins[msg.sender].exists);
        _;
    }
    
    // Admin related modifiers
    modifier adminExists(address _adminAddress) {
        // Second condition to deal with deactivated admins
        require(admins[_adminAddress].exists || admins[_adminAddress].id != 0);
        _;
    }
    
    modifier adminDoesNotExist(address _adminAddress) {
        require(!admins[_adminAddress].exists && admins[_adminAddress].id == 0);
        _;
    }
    
    // Employee related modifiers
    modifier employeeExists(address _employeeAddress) {
        // Second condition to deal with deactivated employees
        require(employees[_employeeAddress].exists || employees[_employeeAddress].id != 0);
        _;
    }

    modifier employeeDoesNotExist(address _employeeAddress) {
        require(!employees[_employeeAddress].exists && employees[_employeeAddress].id == 0);
        _;
    }

    /***************/
    /** Functions **/
    /***************/
    
    // Misc Functions
    constructor(string _companyName, string _companyId, bytes _logo) Ownable() public {
        // Updating company details
        companyName = _companyName;
        companyId = _companyId;
        logo = _logo;
        
        emit OrganisationCreated(_companyName, _companyId, _logo);
    }
    
    function getCompanyName() public view returns (string) {
        return companyName;
    }
    
    function setCompanyName(string _companyName) public onlyOwnerOrAdmins() {
        emit CompanyNameUpdated(companyName, _companyName);
        companyName = _companyName;
    }
    
    function getCompanyId() public view returns (string) {
        return companyId;
    }
    
    function setCompanyId(string _companyId) public onlyOwnerOrAdmins() {
        emit CompanyIdUpdated(companyId, _companyId);
        companyId = _companyId;
    }
    
    function getCompanyLogo() public view returns (bytes) {
        return logo;
    }
    
    function setCompanyLogo(bytes _logo) public onlyOwnerOrAdmins() {
        emit CompanyLogoUpdated(logo, _logo);
        logo = _logo;
    }
    
    // Admin functions
    function addAdmins(address _adminAddress, string _adminName) public onlyOwnerOrAdmins() adminDoesNotExist(_adminAddress) returns (uint64) {
        numAdmins += 1;
        admins[_adminAddress] = Employee({exists: true, id: numAdmins, name: _adminName});
        emit AdminCreated(_adminAddress, numAdmins, _adminName);
        return numAdmins;
    }
    
    function reactivateAdmin(address _adminAddress) public onlyOwnerOrAdmins() adminExists(_adminAddress) {
        admins[_adminAddress].exists = true;
        emit AdminReactivated(_adminAddress);
    }
    
    function deactivateAdmin(address _adminAddress) public onlyOwnerOrAdmins() adminExists(_adminAddress) {
        admins[_adminAddress].exists = false;
        emit AdminDeactivated(_adminAddress);
    }                                                                                                                                                                                                                                                      
    
    function getNumAdmins() public view onlyOwnerOrAdmins() returns (uint32) {
        return numAdmins;
    }
    
    function isAdmin(address _adminAddress) public view returns (bool) {
        return admins[_adminAddress].exists == true;
    }
    
    // Employee functions
    function addEmployees(address _employeeAddress, string _employeeName) public onlyOwnerOrAdmins() returns (uint64) {
        numEmployees += 1;
        employees[_employeeAddress] = Employee({exists: true, id: numEmployees, name: _employeeName});
        emit EmployeeCreated(_employeeAddress, numEmployees, _employeeName);
        return numEmployees;
    }
    
    function reactivateEmployee(address _employeeAddress) public onlyOwnerOrAdmins() employeeExists(_employeeAddress) {
        employees[_employeeAddress].exists = true;
        emit EmployeeReactivated(_employeeAddress);
    }
    
    function deactivateEmployee(address _employeeAddress) public onlyOwnerOrAdmins() employeeExists(_employeeAddress) {
        employees[_employeeAddress].exists = false;
        emit EmployeeDeactivated(_employeeAddress);
    }
    
    function getNumEmployees() public view onlyOwnerOrAdmins() returns (uint32) {
        return numEmployees;
    }
    
    function isEmployee(address _employeeAddress) public view returns (bool) {
        return employees[_employeeAddress].exists = true;
    }

    // Fallback function for accepting ether, no way of withdrawing.
    function () public payable {
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }
    
}

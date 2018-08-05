pragma solidity ^0.4.24;
import "./Ownable.sol";

contract User is Ownable{
    
    /************/
    /** Legend **/
    /************/
    
    // fn = First Name
    // mn = Middle Name
    // ln = Last Name
    // img = Image
    // pa = Postal Address
    // pc = Postal Code
    // cc = Country Code
    // ac = Area Code
    // pn = Phone Number
    // email = Email
    // sex = Gender
    // dob = Date Of Birth
    // job = Occupation
    
    /*********************/
    /** State Variables **/
    /*********************/
    
    struct Status {
        bool approved;
        bool oneTimeAccess;
        
    }
    
    mapping(address => Status) private userPermissions;
    string private nameHash; 
    
    
    // string private lastName;
    // string private middleName;
    // bytes private imageHash; // Don't forget to decode IPFS hash to hex before passing it into the constructor and append 0x!
    // string private postalAddress;
    // string private postalCode;
    // string private countryCode; 
    // string private areaCode;
    // string private phoneNumber;
    // string private email;
    // string private gender;
    // string private dateOfBirth;
    // string private occupation;
    
    /************/
    /** Events **/
    /************/
    
    event LogDeposit(address indexed _sender);
    event FirstNameUpdated(string indexed oldFirstName, string indexed newFirstName);
    event MiddleNameUpdated(string indexed oldMiddleName, string indexed newMiddleName);
    event LastNameUpdated(string indexed oldLastName, string indexed newLastName);
    event ImageUpdated(bytes indexed newImageHash, bytes indexed oldImageHash);
    event PostalAddressUpdated(string indexed oldAddress, string indexed newAddress);
    event PostalCodeUpdated(string indexed oldPostalCode, string indexed newPostalCode);
    event CountryCodeUpdated(string oldCountryCode, string newCountryCode);
    event AreaCodeUpdated(string oldAreaCode, string newAreaCode);
    event PhoneNumberUpdated(string oldPhoneNumber, string newPhoneNumber);
    event EmailUpdated(string oldEmail, string newEmail);
    event GenderUpdated(string oldGender, string newGender);
    event DateOfBirthUpdated(string oldDOB, string newDOB);
    event OccupationUpdated(string oldOccupation, string newOccupation);
    
    /***************/
    /** Modifiers **/
    /***************/
    
    modifier isNotApproved(address _requester) {
        require(!userPermissions[_requester].approved);
        _;
    }
    
    modifier isApproved(address _requester) {
        require(userPermissions[_requester].approved);
        _;
    }
    
    
    
    /***************/
    /** Functions **/
    /***************/
    
    constructor(string _nameHash) Ownable() public {
        nameHash = _nameHash;
    }
    
    function getNameHash() public view returns (string) {
        return nameHash;
    }
    
    function setnameHash(string _nameHash) public onlyOwner() returns (bool) {
        nameHash = _nameHash;
    }
    
    // Approve to view for X time.
    
    
    
    
    function approveOnce(address _requester) private onlyOwner() isNotApproved(_requester) {
        userPermissions[_requester].approved = true;
        userPermissions[_requester].oneTimeAccess = true;
    }
    
    function approveIndefinitely(address _requester) private onlyOwner() isNotApproved(_requester) {
        userPermissions[_requester].approved = true;
    }
    
    function unapprove(address _requester) private onlyOwner() isApproved(_requester) {
        userPermissions[_requester].approved = false;
        userPermissions[_requester].oneTimeAccess = false;
    }

    

    
    
    
    
    
    
    // Fallback function for accepting ether, no way of withdrawing.
    function () public payable {
        require(msg.data.length == 0);
        emit LogDeposit(msg.sender);
    }
    
    
}
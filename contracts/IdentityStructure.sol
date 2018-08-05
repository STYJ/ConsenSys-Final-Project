pragma solidity ^0.4.24;
import "./Ownable.sol";

contract IdentityStructure is Ownable {
    
    mapping(address => IdentityFormat) private identityFormats; // Mapping from creator of the IdentityFormat to the IdentityFormat created.
    
    
    struct IdentityFormat {
        bool exists;
        address owner;
        Attribute[] attributes;
    }
    
    struct Attribute {
        string attributeName;
        string attributeType;
        string[] attributeValues;
    }
    
    modifier isOwnerOfIdStruct() {
        require(identityFormats[msg.sender].owner == msg.sender);
        _;
    }
    
    function createIdentityFormat() public {
        identityFormats[msg.sender].exists = true;
        identityFormats[msg.sender].owner = msg.sender;
    }
    
    function addAttribute(string _attributeName, string _attributeType, string _attributeValues) public isOwnerOfIdStruct() {
        identityFormats[msg.sender].attributes.attributeName = Attribute({attributeName: _attributeName, attributeType: _attributeType})
    }
    
    
    
    
    
    
}

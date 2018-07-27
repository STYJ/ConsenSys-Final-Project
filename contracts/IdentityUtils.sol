pragma solidity ^0.4.24;


contract IdentityUtils {
    
    
    struct Attribute {
        
    }
    
    
    
        
    struct Structure {
        string name; // Name of structure
        address owner;
        
        
        mapping(string => int256) intAttributes;
        string[] intKeys;
        uint intSize;
        
        mapping(string => string) stringAttributes;
        string[] stringKeys;
        uint stringSize;
        
        // mapping(string => bool) boolAttributes;
        // mapping(string => address) addressAttributes;
        
        
        
    }
    
    
    
    
}
pragma solidity ^0.4.24;
import "./Ownable.sol";

contract Attribute is Ownable {

    string internal name;
    uint internal len;
    
    constructor (string _name) Ownable() public {
        name = _name;
        len = 0;
    }
    
    function getName() view public returns (string) { // to do: add limit for length of name
        return name;
    }
    
    function updateName(string _name) public onlyOwner() {
        name = _name;
    }
    
    function getLen() view public returns (uint) { // to do: add limit for max number of values
        return len;
    }
    
}

// Example int attribute
contract IntAttribute is Attribute {
    
    int[] private values;
    
    constructor (string _name) Attribute(_name) public {}
    
    function addValue(int value) public onlyOwner() {
        values.push(value);   
        len += 1;
    }
    
    function deleteValue(uint index) public onlyOwner() {
        require(index < len);
        
        for (uint i = index; i<len-1; i++){
            values[i] = values[i+1];
        }
        delete values[len-1];
        len--;
    }
    
    function getValues() public view returns (int[]) {
        return values;
    }
    
}

// array of IntAttribute called IntAttributes
// mapping from name (in fixed number of bytes, 22 for 10 character name) to uint 
pragma solidity 0.7.5;

import "./test.sol";
import "../src/bonding/FactoryStorage.sol";
import "../src/bonding/Factory.sol";
import "../src/bonding/Helper.sol";
import "../src/bonding/SubsidyRouter.sol";
import "../src/bonding/CustomBond.sol";
import "../src/mock/MockToken2.sol";

contract User {
    CustomBond bond;
    MockToken2 internal mockToken;
    constructor(CustomBond _bond,MockToken2 _mockToken) {
        bond = _bond;
        mockToken = _mockToken;
    }

    function deposit(
        uint256 _amount,
        uint256 _maxPrice,
        address _depositor
    ) external {
        mockToken.approve(address(bond),_amount);
        bond.deposit(_amount, _maxPrice, _depositor);
    }

    function approve(
        address _address,
        uint256 _amount
        
        
    ) external returns (bool){
        return mockToken.approve(_address,_amount);
    }
}

contract Setup {}

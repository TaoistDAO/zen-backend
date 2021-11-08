pragma solidity 0.7.5;

import "./test.sol";
import "../src/bonding/FactoryStorage.sol";
import "../src/bonding/Factory.sol";
import "../src/bonding/Helper.sol";
import "../src/bonding/SubsidyRouter.sol";
import "../src/bonding/CustomBond.sol";

contract User {
    CustomBond bond;

    constructor(CustomBond _bond) {
        bond = _bond;
    }

    function deposit(
        uint256 _amount,
        uint256 _maxPrice,
        address _depositor
    ) public {
        bond.deposit(_amount, _maxPrice, _depositor);
    }
}

contract Setup {}

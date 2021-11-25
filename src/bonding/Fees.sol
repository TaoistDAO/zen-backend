// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.5;

import "../libraries/SafeMath.sol";
import "hardhat/console.sol";

contract Fees {    
    using SafeMath for uint256;
    
    address public DAO;

    uint256[] public tierCeilings; 
    uint256[] public fees;
    
    event FeesAndTierCeilings(uint256[] tierCeilings, uint256[] fees);

    modifier onlyDAO() {
        require(msg.sender == DAO, "Only DAO call");
        _;
    }

    constructor(address _dao) {
        require(_dao != address(0), "Fees: DAO bad address");
        DAO = _dao;
    }

    /// @notice set fee for creating bond
    /// @param _tierCeilings uint[]
    /// @param _fees uint[]
    function setTiersAndFees(
        uint256[] calldata _tierCeilings, 
        uint256[] calldata _fees
    ) external onlyDAO {
        require(_tierCeilings.length == _fees.length, "setTiersAndFees: Bad items");

        uint256 feeSum = 0;
        for (uint256 i; i < _fees.length; i++) {
            feeSum = feeSum.add(_fees[i]);
        }
        
        require(feeSum > 0, "setTiersAndFees: Bad feeSum");

        for (uint256 i; i < _fees.length; i++) {
            tierCeilings.push(_tierCeilings[i]);
            fees.push(_fees[i]);
        }

        emit FeesAndTierCeilings(_tierCeilings, _fees);
    }

    /// @notice Get fees for bond
    function getFees() external view returns (uint256[] memory) {
        return fees;
    }

    /// @notice Get tierCeilings for bond
    function getTierCeilings() external view returns (uint256[] memory) {
        return tierCeilings;
    }
}
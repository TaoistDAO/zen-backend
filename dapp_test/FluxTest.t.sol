// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.5;

import "./FluxSetup.t.sol";

contract FluxTest is FluxSetupTest {
    uint256[] public newFees = [50000];

    function test_FeeAndTierCeilings() public {
        uint256 i = 0;
        emit log_uint(factory.fees(i));
        assertEq(factory.fees(i), [30000][i]);
        assertEq(factory.tierCeilings(i), [0][i]);
    }

    function test_createBondAndTreasury() public {
        emit log_address(address(customTreasury));
        emit log_address(address(customBond));
        assertEq(address(customTreasury), address(customTreasury));
    }

    function test_initializeBond() public {
        assertEq(customBond.terms(), 825000);
    }
}

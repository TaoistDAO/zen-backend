// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.5;

import "./FluxSetup.t.sol";

contract FluxTest is FluxSetupTest {
    function createBondAndTreasury() public {
        assertEq(factory.TREASURY(), taoTreasury);
    }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.5;

import "./FluxSetup.sol";
import "../src/libraries/SafeMath.sol";

contract FluxTest is FluxSetupTest {
    uint256[] public newFees = [50000];

    function test_FeeAndTierCeilings() public {
        uint256 i = 0;
        assertEq(factory.fees(i), [30000][i]);
        assertEq(factory.tierCeilings(i), [0][i]);
    }

    function test_createBondAndTreasury() public {
        // emit log_address(address(customTreasury));
        // emit log_address(address(customBond));
        assertEq(address(customTreasury), address(customTreasury));
    }
    function test_treasuryHasPayoutTokenFunds() public {
        assertEq(mockToken.balanceOf(address(customTreasury)),10000000000000000000000);
    }

    function test_initializeBond() public {
        (uint256 controlVariable, , , , ) = customBond.terms();

        uint256 bondPrice = customBond.bondPrice();
        uint256 marketPrice = 500000000;
        uint temp = 100 - ((bondPrice  * 100) / marketPrice);
        int discount = 100 - ((int(bondPrice) / int(marketPrice)) * 100);
        uint256 valueOfLpToken = customTreasury.valueOfToken(address(lpToken), bondPrice);
        uint256 payout = customBond.payoutFor(valueOfLpToken);
    
        emit log_string("debt ratio: ");
        emit log_uint(customBond.debtRatio());
        emit log_string("bond price: ");
        emit log_uint(customBond.bondPrice());
        emit log_string("marketPrice : ");
        emit log_uint(marketPrice);
        emit log_string("discout precentage %: ");
        emit log_uint(temp);
        emit log_string("payout: ");
        emit log_uint(payout );
        assertEq(controlVariable, 825000);
    }

    function test_userBalance() public {
        assertEq(lpToken.balanceOf(address(user)), 3300000000000000000);
    }

    function test_userDeposit() public {
        uint256 lpDepositAmount = 660000000000000000;
        uint256 maxDepositAmount = 670000000000000000;
        
        user.deposit(lpDepositAmount,maxDepositAmount,address(user));
        user.deposit(2*lpDepositAmount,maxDepositAmount,address(user));
        uint256 bondPrice = customBond.bondPrice();
        uint256 marketPrice = 500000000;
        uint temp = 100 - ((bondPrice  * 100) / marketPrice);
        emit log_string("discout precentage %: ");
        emit log_uint(temp);
        emit log_string("bond price: ");
        emit log_uint(customBond.bondPrice());
        emit log_string("debt ratio: ");
        emit log_uint(customBond.debtRatio());

        assertEq(lpToken.balanceOf(address(user)), 3300000000000000000 - 3*lpDepositAmount);
        
        
    }
}

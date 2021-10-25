// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.5;

interface ITreasury {
    function deposit(
        address _principleTokenAddress, 
        uint _amountPrincipleToken, 
        uint _amountPayoutToken
    ) external;

    function valueOfToken(
        address _principleTokenAddress, 
        uint _amount
    ) external view returns ( uint value_ );
}
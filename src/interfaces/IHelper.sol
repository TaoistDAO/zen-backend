// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.5;

/// @notice Interface for all adapters
interface IHelper {

    function swapForDeposit(
        address _target,
        bytes calldata _swapArgs
    ) external returns (uint256 expectedAmount_);

    function lendForLP(
        address _target,
        bytes calldata _lendArgs
    ) external returns (address lpAddress_, uint256 lpAmount_);

}

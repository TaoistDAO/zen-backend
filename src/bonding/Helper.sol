

// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.5;

import "../libraries/SafeMath.sol";
import "../libraries/SafeERC20.sol";
import "../interfaces/IUniswapV2Router2.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IHelper.sol";
import "hardhat/console.sol";

contract Helper is IHelper {
    
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    address private immutable UNISWAP2_FACTORY;
    address private immutable UNISWAP2_ROUTER;
    IERC20 private constant ETH_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    /// @dev Provides a standard implementation for transferring assets between
    /// the _target address and the adapter, by wrapping the action.
    modifier transferHandler(address _target, bytes memory _encodedArgs) {
        (
            uint256 spendAssetAmount,
            address spendAsset,
            address incomingAsset
        ) = __decodeSwapArgs(_encodedArgs);

        IERC20(spendAsset).safeTransferFrom(_target, address(this), spendAssetAmount);

        // Execute call
        _;

        // Transfer remaining assets back to the _target address
        __transferAssetToFund(_target, incomingAsset);
        __transferAssetToFund(_target, spendAsset);
    }

    constructor(
        address _uniswap2_router,
        address _uniswap2_factory
    ) {
        require(_uniswap2_router != address(0), "Helper: uniswap2_router must not be zero address");
        UNISWAP2_ROUTER = _uniswap2_router;
        require(_uniswap2_factory != address(0), "Helper: uniswap2_factory must not be zero address");
        UNISWAP2_FACTORY = _uniswap2_factory;
    }

    function swapForDeposit(
        address _target,
        bytes calldata _swapArgs
    )
        external
        override        
        transferHandler(_target, _swapArgs)
        returns (uint256 expectedAmount_)
    {
        (
            uint256 payoutAmount,
            address payoutAsset,
            address incomingAsset
        ) = __decodeSwapArgs(_swapArgs);

        address[] memory path = new address[](2);
        path[0] = payoutAsset;
        path[1] = incomingAsset;

        // Get expected output amount on Uniswap
        expectedAmount_ = IUniswapV2Router2(UNISWAP2_ROUTER).getAmountsOut(payoutAmount, path)[1];

        console.log("====sol-expectedDenomAmount::", expectedAmount_, payoutAmount);

        __swapForDeposit(_target, payoutAmount, expectedAmount_, path);

        return expectedAmount_;
    }

    /// @dev Avoid stack too deep
    function __swapForDeposit(
        address _target,
        uint256 _payoutAmount,
        uint256 _expectedAmount,
        address[] memory _path
    ) private {
        __approveMaxAsNeeded(_path[0], UNISWAP2_ROUTER, _payoutAmount);

        // Execute swap on Uniswap
        if(address(_path[1]) == address(ETH_ADDRESS)) {
            IUniswapV2Router2(UNISWAP2_ROUTER).swapExactTokensForETH(
                _payoutAmount,
                _expectedAmount,
                _path,
                _target,
                block.timestamp.add(1)
            );
        } else {
            IUniswapV2Router2(UNISWAP2_ROUTER).swapExactTokensForTokens(
                _payoutAmount,
                _expectedAmount,
                _path,
                _target,
                block.timestamp.add(1)
            );
        }
    }

    /// @notice Lends lp tokens on Uniswap
    /// @param _target The address of the calling fund
    /// @param _lendArgs Encoded order parameters
    function lendForLP(
        address _target,
        bytes calldata _lendArgs
    )
        external                
        override
        transferHandler(_target, _lendArgs)
        returns (address lpAddress_, uint256 lpAmount_)
    {
        (
            address[2] memory tokens,
            uint256[2] memory amountsDesired
        ) = __decodeLendArgs(_lendArgs);

        lpAmount_ = __lendForLP(
            _target,
            tokens[0],
            tokens[1],
            amountsDesired[0],
            amountsDesired[1],
            amountsDesired[0],
            amountsDesired[1]
        );        

        lpAddress_ = IUniswapV2Factory(UNISWAP2_FACTORY).getPair(tokens[0], tokens[1]);
    }

    /// @dev Avoid stack too deep
    function __lendForLP(
        address _target,
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin
    ) private returns (uint256 lpAmount_) {
        __approveMaxAsNeeded(_tokenA, UNISWAP2_ROUTER, _amountADesired);
        __approveMaxAsNeeded(_tokenB, UNISWAP2_ROUTER, _amountBDesired);

        // Execute lend on Uniswap
        (, , lpAmount_) = IUniswapV2Router2(UNISWAP2_ROUTER).addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _target,
            block.timestamp.add(1)
        );
    }
    /// @dev Helper to decode swap encoded call arguments
    function __decodeSwapArgs(bytes memory _encodedCallArgs)
        private
        pure
        returns (
            uint256 payoutAmount_,
            address payoutAsset_,
            address denomAsset_
        )
    {
        return abi.decode(_encodedCallArgs, (uint256, address, address));
    }

    /// @dev Helper to decode the lend encoded call arguments
    function __decodeLendArgs(bytes memory _encodedCallArgs)
        private
        pure
        returns (
            address[2] memory tokens,
            uint256[2] memory amountsDesired
        )
    {
        return abi.decode(_encodedCallArgs, (address[2], uint256[2]));
    }

    /// @dev Helper for adapters to approve their integratees with the max amount of an asset.
    /// Since everything is done atomically, and only the balances to-be-used are sent to adapters,
    /// there is no need to approve exact amounts on every call.
    function __approveMaxAsNeeded(
        address _asset,
        address _target,
        uint256 _neededAmount
    ) internal {
        if (IERC20(_asset).allowance(address(this), _target) < _neededAmount) {
            IERC20(_asset).safeApprove(_target, type(uint256).max);
        }
    }

    function __transferAssetToFund(address _target, address _asset) private {
        uint256 postCallAmount = IERC20(_asset).balanceOf(address(this));
        if (postCallAmount > 0) {
            IERC20(_asset).safeTransfer(_target, postCallAmount);
        }
    }

    /// @notice Gets the `FACTORY` variable
    function getUniswapFactory() external view returns (address factory_) {
        return UNISWAP2_FACTORY;
    }

    /// @notice Gets the `UNISWAP2_ROUTER` variable
    function getUniswapRouter() external view returns (address router_) {
        return UNISWAP2_ROUTER;
    }
}

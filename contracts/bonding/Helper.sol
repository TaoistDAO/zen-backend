

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
    /// the _caller address and the helper, by wrapping the action.
    modifier transferHandler(address _caller, bytes memory _encodedArgs) {
        (
            uint256 spendAssetAmount,
            address spendAsset,
            address incomingAsset
        ) = __decodeSwapArgs(_encodedArgs);
        
        IERC20(spendAsset).safeTransferFrom(_caller, address(this), spendAssetAmount);

        // Execute call
        _;
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
        address _caller,        
        bytes calldata _swapArgs
    )
        external
        override        
        transferHandler(_caller, _swapArgs)
        returns (address lpAddress_, uint256 lpAmount_)
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
        uint256 expectedAmount_ = IUniswapV2Router2(UNISWAP2_ROUTER).getAmountsOut(payoutAmount.div(2), path)[1];
        
        if(address(path[0]) == address(ETH_ADDRESS)) {
            (lpAddress_, lpAmount_) = __swapETHForDeposit(_caller, payoutAmount.div(2), expectedAmount_, path);
        } else {
            (lpAddress_, lpAmount_) = __swapTokenForDeposit(_caller, payoutAmount.div(2), expectedAmount_, path);
        }
    }

    /// @notice Swap Token to Token
    /// @dev Avoid stack too deep
    function __swapTokenForDeposit(
        address _caller,
        uint256 _payoutAmount,
        uint256 _expectedAmount,
        address[] memory _path
    ) private returns (address lpAddress_, uint256 lpAmount_) {
        __approveMaxAsNeeded(_path[0], UNISWAP2_ROUTER, _payoutAmount);

        console.log("==sol-swapToken::", IERC20(_path[0]).balanceOf(address(this)), IERC20(_path[1]).balanceOf(address(this)));
        // Execute swap Token on Uniswap
        IUniswapV2Router2(UNISWAP2_ROUTER).swapExactTokensForTokens(
            _payoutAmount,
            _expectedAmount,
            _path,
            address(this),
            block.timestamp.add(1)
        );
        
        (lpAddress_, lpAmount_) = lendForLPDirect(
            _caller,
            _path[0],
            _path[1],
            _payoutAmount,
            _expectedAmount,
            _payoutAmount,
            _expectedAmount
        );

    }

    /// @dev Avoid stack too deep
    function __swapETHForDeposit(
        address _caller,
        uint256 _payoutAmount,
        uint256 _expectedAmount,
        address[] memory _path
    ) public payable returns (address lpAddress_, uint256 lpAmount_) {
        __approveMaxAsNeeded(_path[0], UNISWAP2_ROUTER, _payoutAmount);

        console.log("==sol-swapETH::", _expectedAmount);
        // Execute swap ETH/WETH on Uniswap
        IUniswapV2Router2(UNISWAP2_ROUTER).swapExactETHForTokens(
            _expectedAmount,
            _path,
            address(this),
            block.timestamp.add(1)
        );
        
        console.log("==sol-swapETH::", "ok");
        (lpAddress_, lpAmount_) = lendForLPDirect(
            _caller,
            _path[0],
            _path[1],
            _payoutAmount,
            _expectedAmount,
            _payoutAmount,
            _expectedAmount
        );

    }

    function lendForLPDirect(
        address _caller,
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAmin,
        uint256 _amountBmin
    )
        public  
        returns (address lpAddress_, uint256 lpAmount_)
    {
        if(_tokenA == address(ETH_ADDRESS)) {
            lpAmount_ = __lendETHForLPDirect(
                _caller,
                _tokenA,
                _tokenB,
                _amountADesired,
                _amountBDesired,
                _amountAmin,
                _amountBmin
            );
        } else {
            lpAmount_ = __lendTokenForLPDirect(
                _caller,
                _tokenA,
                _tokenB,
                _amountADesired,
                _amountBDesired,
                _amountAmin,
                _amountBmin
            ); 
        }
               

        lpAddress_ = IUniswapV2Factory(UNISWAP2_FACTORY).getPair(_tokenA, _tokenB);

        __transferAssetToCaller(_caller, lpAddress_);        
    }

    /// @notice addLiquidityETH for lp tokens on Uniswap
    /// @dev Avoid stack too deep
    function __lendETHForLPDirect(
        address _caller,
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin
    ) public payable returns (uint256 lpAmount_) {
        __approveMaxAsNeeded(_tokenA, UNISWAP2_ROUTER, _amountADesired);
        __approveMaxAsNeeded(_tokenB, UNISWAP2_ROUTER, _amountBDesired);
        
        require(IUniswapV2Factory(UNISWAP2_FACTORY).getPair(_tokenA, _tokenB) != address(0), "Lend: No Pool");

        payable(address(UNISWAP2_ROUTER)).transfer(_amountADesired);
        // Execute lend on Uniswap
        console.log("==sol-payoutL::", IERC20(_tokenA).balanceOf(address(this)), _amountADesired);
        (, , lpAmount_) = IUniswapV2Router2(UNISWAP2_ROUTER).addLiquidityETH (
            _tokenB,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _caller,
            block.timestamp.add(1)
        );
    }

    /// @notice addLiquidity for lp tokens on Uniswap
    /// @dev Avoid stack too deep
    function __lendTokenForLPDirect(
        address _caller,
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin
    ) public payable returns (uint256 lpAmount_) {
        __approveMaxAsNeeded(_tokenA, UNISWAP2_ROUTER, _amountADesired);
        __approveMaxAsNeeded(_tokenB, UNISWAP2_ROUTER, _amountBDesired);
        
        require(IUniswapV2Factory(UNISWAP2_FACTORY).getPair(_tokenA, _tokenB) != address(0), "Lend: No Pool");

        // Execute lend on Uniswap
        console.log("==sol-payoutT::", IERC20(_tokenA).balanceOf(address(this)), IERC20(_tokenB).balanceOf(address(this)));
        (, , lpAmount_) = IUniswapV2Router2(UNISWAP2_ROUTER).addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _caller,
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

    /// @dev Helper to transfer full contract balances of assets to the caller
    function __transferAssetToCaller(address _target, address _asset) private {
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

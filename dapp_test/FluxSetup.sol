// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.5;

import "./test.sol";
import "../src/bonding/FactoryStorage.sol";
import "../src/bonding/Factory.sol";
import "../src/bonding/Helper.sol";
import "../src/bonding/SubsidyRouter.sol";
import "./setup.sol";
import "../src/mock/MockToken2.sol";

contract FluxSetupTest is DSTest {
    FactoryStorage internal factoryStorage;
    Factory internal factory;
    Helper internal helper;
    SubsidyRouter internal subsidyRouter;
    MockToken2 internal mockToken;
    MockToken2 internal lpToken;
    CustomBond internal customBond;
    CustomTreasury internal customTreasury;
    User internal user;

    address public dao = 0x1A621BBd762a52b01c3eF070D3317c8589c37915;
    address public uniswapFactory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address public uniswapRouter = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public sushiswapFactory = 0xc35DADB65012eC5796536bD9864eD8773aBc74C4;
    address public sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address public taoTreasury = 0xc3Ab493d0d06c700d9daF7Ea58aBBe12038ec474;

    uint256[] public tierCeilings = [0];
    uint256[] public fees = [30000];
    int public num =0;

    function setUp() public {
        helper = new Helper(uniswapFactory, uniswapRouter, sushiswapFactory, sushiswapRouter);
        factoryStorage = new FactoryStorage();
        subsidyRouter = new SubsidyRouter();
        factory = new Factory(taoTreasury, address(factoryStorage), address(subsidyRouter), dao, address(helper));
        factory.setTiersAndFees(tierCeilings, fees);
        mockToken = new MockToken2("FLUX", "FLX",18 ,100000000000000000000000);
        lpToken = new MockToken2("Liquidity token", "LP",18, 100000000000000000000000);
        initUsers();
        createBondAndTreasury();
        initializeBond();
     
    }

    function initUsers() public {
        user = new User(customBond);
        lpToken.transfer(address(user), 100000000000000000000);
        // mockToken.balanceOf(address(user));
    }

    function initializeBond() public {
        uint256 _controlVariable = 825000;
        uint256 _vestingTerm = 46200;
        uint256 _minimumPrice = 36760;
        uint256 _maxPayout = 4;
        uint256 _maxDebt = 1250000000000000000000;
        uint256 _initialDebt = 400000000000000000000;
        customBond.initializeBond(_controlVariable, _vestingTerm, _minimumPrice, _maxPayout, _maxDebt, _initialDebt);
    }

    function createBondAndTreasury() public {
        address bondAdrs;
        address treasuryAdrs;
        (treasuryAdrs, bondAdrs) = factory.createBondAndTreasury(address(mockToken), address(lpToken), address(this));
        customBond = CustomBond(payable(bondAdrs));
        customTreasury = CustomTreasury(payable(treasuryAdrs));
    }

    // function test_factoryOwnerExpected() public {
    //     assertEq(factory.policy(), address(this));
    //     assertEq(factory.FACTORY_STORAGE(), address(factoryStorage));
    //     assertEq(factory.SUBSIDY_ROUTER(), address(subsidyRouter));
    //     assertEq(factory.DAO(), dao);
    //     assertEq(factory.TREASURY(), taoTreasury);
    // }
}

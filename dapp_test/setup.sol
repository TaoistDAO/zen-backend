pragma solidity 0.7.5;

import "./test.sol";
import "../src/bonding/FactoryStorage.sol";
import "../src/bonding/Factory.sol";
import "../src/bonding/Helper.sol";
import "../src/bonding/SubsidyRouter.sol";

contract Setup {
    // FactoryStorage internal factoryStorage;
    // Factory internal factory;
    // Helper internal helper;
    // SubsidyRouter internal subsidyRouter;
    // address public dao = 0x1A621BBd762a52b01c3eF070D3317c8589c37915;
    // address public uniswapFactory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    // address public uniswapRouter = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // address public sushiswapFactory = 0xc35DADB65012eC5796536bD9864eD8773aBc74C4;
    // address public sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    // address public taoTreasury = 0xc3Ab493d0d06c700d9daF7Ea58aBBe12038ec474;
    // function setUp() public {
    //     helper = new Helper(uniswapFactory, uniswapRouter, sushiswapFactory, sushiswapRouter);
    //     factoryStorage = new FactoryStorage();
    //     subsidyRouter = new SubsidyRouter();
    //     factory = new Factory(taoTreasury, address(factoryStorage), address(subsidyRouter), dao, address(helper));
    // }
    // function test_factoryOwnerExpected() public {
    //     assertEq(factory.policy(), address(this));
    //     assertEq(factory.FACTORY_STORAGE(), address(factoryStorage));
    //     assertEq(factory.SUBSIDY_ROUTER(), address(subsidyRouter));
    //     assertEq(factory.DAO(), dao);
    //     assertEq(factory.TREASURY(), taoTreasury);
    // }
}

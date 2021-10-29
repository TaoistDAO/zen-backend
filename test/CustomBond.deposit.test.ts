import {expect} from './chai-setup';
import {ethers, deployments} from 'hardhat';
import {setupUsers, config, randomAddress} from './utils';
import {Factory, FactoryStorage, Helper, SubsidyRouter, MockToken} from '../typechain';
// import { MockToken } from '../typechain/MockToken';
import { BigNumber, BigNumberish, utils } from 'ethers';
const ERC20 = require('./utils/ERC20.json');

// TEST : Rinkeby testnet
const setup = deployments.createFixture(async () => {
  await deployments.fixture('Factory');
  
  const contracts = {
    FactoryContract: <Factory>await ethers.getContract('Factory'),
    FactoryStorageContract: <FactoryStorage>await ethers.getContract('FactoryStorage'),
    SubsidyRouterContract: <SubsidyRouter>await ethers.getContract('SubsidyRouter'),
    HelperContract: <Helper>await ethers.getContract('Helper'),
    MockTokenContract: <MockToken>await ethers.getContract('MockToken'),
  };  
  
  const [deployer, user] = await ethers.getSigners();
  
  return {
    ...contracts, deployer, user
  };
});

const convert = (addr: string) => {
  return addr.toLowerCase();
}

describe('CustomBond', async function () {
  beforeEach(async function () {
    const {
      deployer, user,
      FactoryContract,
      MockTokenContract
    } = await setup();

    const mToken = await MockTokenContract.deployed();
    this.principleTokenAddr = mToken.address;
    this.deployerAddr = deployer.address;

    await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

    const tx = await FactoryContract.createBondAndTreasury(
      config.usdcAdress, 
      mToken.address, 
      deployer.address, 
    )

    const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
    const BondFactory = await ethers.getContractFactory('CustomBond');

    let events: any = [];
    events = (await tx.wait()).events;
    
    this.customTreasuryAddr = events[0].args.treasury;
    this.customBondAddr = events[0].args.bond;
    this.TreasuryContract = TreasuryFactory.attach(this.customTreasuryAddr);
    this.BondContract = BondFactory.attach(this.customBondAddr);
  });
    
  it('initializeBond, setBondTerms, setAdjustment', async function () {
    await this.BondContract.setBondTerms(0, 20000)//_input >= 10000, terms.vestingTerm
    await this.BondContract.setBondTerms(1, 500)  //_input <= 1000,  terms.maxPayout
    await this.BondContract.setBondTerms(2, 2000) //                 terms.maxDebt

    const txDebtDecay = await this.BondContract.debtDecay()
    const txCurDebt = await this.BondContract.currentDebt()
    expect(txDebtDecay.toString()).to.equal('0')
    expect(txCurDebt.toString()).to.equal('0')

    const controlVariable = 2;
    const vestingTerm = 2;
    const minimumPrice = 2;
    const maxPayout = 2;
    const maxDebt = 2;
    const initialDebt = 2;
    const txInit = await this.BondContract.initializeBond(
      controlVariable,
      vestingTerm,
      minimumPrice,
      maxPayout,
      maxDebt,
      initialDebt
    )
    const totalDebt = await this.BondContract.totalDebt();
    expect(totalDebt.toString()).to.equal(initialDebt.toString())
    const lastDecay = await this.BondContract.lastDecay();//27277418
    expect(lastDecay).to.equal(await ethers.provider.getBlockNumber())

    const addition = true;
    const increment = 10;
    const target = 2000;
    const buffer = 100;
    await expect(this.BondContract.setAdjustment(
      addition,
      increment,
      target,
      buffer
    )).to.be.revertedWith('Increment too large');

    // initialization bond
    await this.BondContract.initializeBond(1000, 20, 500, 100, 1000, 100)
    const txS = await this.BondContract.setAdjustment(addition,  increment, target, buffer)
    // console.log(await txS.wait());
  }); 
  
  it('setLPtokenAsFee', async function () {
    const [deployer, user] = await ethers.getSigners();
    await this.BondContract.connect(deployer).setLPtokenAsFee(true, {from:deployer.address});
    expect(await this.BondContract.connect(deployer).lpTokenAsFeeFlag({from:deployer.address})).to.true
    await this.BondContract.setLPtokenAsFee(false);
    expect(await this.BondContract.lpTokenAsFeeFlag()).to.false

    await expect(
      this.BondContract.connect(user).setLPtokenAsFee({from: user.address})
    ).to.be.revertedWith('Ownable: caller is not the owner')
  });

  it('changeOlyTreasury', async function () {
    await expect(
      this.BondContract.changeOlyTreasury(await randomAddress())
    ).to.be.revertedWith('Only DAO')
  });
});

describe('CustomBond-deposit with principleToken', async function () {
  it('deposit(deployer)', async function () {      
    const {
      deployer, user,
      FactoryContract,
      MockTokenContract
    } = await setup();

    // deployer=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 
    // user=0x70997970C51812dc3A010C7d01b50e0d17dc79
    // const myBalance = await ethers.provider.getBalance(deployer.address)

    const principleToken = await MockTokenContract.deployed();

    await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

    const tx = await FactoryContract.createBondAndTreasury(
      config.usdcAdress, 
      principleToken.address, 
      deployer.address, 
    )

    const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
    const BondFactory = await ethers.getContractFactory('CustomBond');

    let events: any = [];
    events = (await tx.wait()).events; 
    const customTreasuryAddr = events[0].args.treasury;
    const customBondAddr = events[0].args.bond;
    const TreasuryContract = TreasuryFactory.attach(customTreasuryAddr);
    const BondContract = BondFactory.attach(customBondAddr);

    // Policy(deployer) set bond terms    
    await BondContract.setBondTerms(0, 20000)//_input >= 10000, terms.vestingTerm
    await BondContract.setBondTerms(1, 150)  //_input <= 1000,  terms.maxPayout
    await BondContract.setBondTerms(2, 2000) //                 terms.maxDebt

    // Policy(deployer) initialization bond
    const controlVariable = 1000;
    const vestingTerm = 25000;
    const minimumPrice = 600;
    const maxPayout = 200;
    const maxDebt = 1000;
    const initialDebt = 100;
    await BondContract.initializeBond(controlVariable, vestingTerm, minimumPrice, maxPayout, maxDebt, initialDebt)

    // set adjustment
    const addition = true;
    const increment = 10;
    const target = 2000;
    const buffer = 100;
    await BondContract.setAdjustment(addition,  increment, target, buffer)
    
    // deposit     
    const tokenContract = new ethers.Contract(principleToken.address, JSON.stringify(ERC20), ethers.provider)
    const payoutTokenContract = new ethers.Contract(config.usdcAdress, JSON.stringify(ERC20), ethers.provider)
    const daiBalance = Number(await payoutTokenContract.balanceOf(deployer.address));//2000000000000000000
    
    //Approve(principleToken) to deposit in frontend(user)
    const tokenSupply = await tokenContract.totalSupply();//1e+26
    await tokenContract.connect(deployer).approve(BondContract.address, tokenSupply, {from: deployer.address});
    
    // Policy(deployer) allow to deposit from user
    await TreasuryContract.toggleBondContract(BondContract.address)

    const amount = utils.parseEther('2');
    const maxPrice = 5000;

    // Transfer(payoutToken) to TreasuryContract for testing
    const transferAmount = utils.parseUnits('1', await tokenContract.decimals());//33333333333
    await payoutTokenContract.connect(deployer).transfer(TreasuryContract.address, transferAmount, {from: deployer.address});
   
    const txd = await BondContract.connect(deployer).deposit(amount, maxPrice, user.address, {from:deployer.address});
    events = (await txd.wait()).events;      
    console.log("====events::", events)
    const bondCreatedEvent = events[7].args;
    const deposit = Number(BigNumber.from(bondCreatedEvent.deposit))
    const payout = Number(BigNumber.from(bondCreatedEvent.payout))
    const expires = Number(BigNumber.from(bondCreatedEvent.expires))
    expect(Number(amount)).to.equal(deposit);

    const blockNum = await ethers.provider.getBlockNumber()
    const expiresSol = BigNumber.from(blockNum).add(vestingTerm);
    expect(Number(expiresSol)).to.equal(expires);
    
    const bondPriceChangedEvent = events[8].args;
    const internalPrice = Number(BigNumber.from(bondPriceChangedEvent.internalPrice))
    const debtRatio = Number(BigNumber.from(bondPriceChangedEvent.debtRatio))

    const debtRatioSol = await BondContract.connect(deployer).debtRatio({from:deployer.address});
    expect(Number(debtRatioSol)).to.equal(debtRatio)

    // debtRatio=0 so that price = terms.minimumPrice;
    const priceSol = minimumPrice;
    expect(Number(priceSol)).to.equal(internalPrice)
  });

  it('deposit(user)', async function () {      
    const {
      deployer, user,
      FactoryContract,
      MockTokenContract
    } = await setup();

    // deployer=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 
    // user=0x70997970C51812dc3A010C7d01b50e0d17dc79
    // const myBalance = await ethers.provider.getBalance(deployer.address)

    const principleToken = await MockTokenContract.deployed();

    await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

    const tx = await FactoryContract.connect(user).createBondAndTreasury(
      config.usdcAdress, 
      principleToken.address, 
      user.address, 
      {from:user.address}
    )

    const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
    const BondFactory = await ethers.getContractFactory('CustomBond');
    let events: any = [];
    events = (await tx.wait()).events;    
    const customTreasuryAddr = events[0].args.treasury;
    const customBondAddr = events[0].args.bond;
    const TreasuryContract = TreasuryFactory.attach(customTreasuryAddr);
    const BondContract = BondFactory.attach(customBondAddr);

    // set bond terms
    await BondContract.connect(user).setBondTerms(0, 20000, {from: user.address})//_input >= 10000, terms.vestingTerm
    await BondContract.connect(user).setBondTerms(1, 150, {from: user.address})  //_input <= 1000,  terms.maxPayout
    await BondContract.connect(user).setBondTerms(2, 2000, {from: user.address}) //                 terms.maxDebt

    // initialization bond
    const controlVariable = BigNumber.from(825000);
    const vestingTerm = BigNumber.from(46200);
    const minimumPrice = BigNumber.from(36760);
    const maxPayout = BigNumber.from(4);
    const maxDebt = utils.parseEther('1250');
    const initialDebt = utils.parseEther('400')
    await BondContract.connect(user).initializeBond(controlVariable, vestingTerm, minimumPrice, maxPayout, maxDebt, initialDebt, {from:user.address})
    
    // deposit
    // payoutTokenContract=Dai(decimals:6), 
    // principleToken=tokenContract(decimals:18)     
    const payoutTokenContract = new ethers.Contract(config.usdcAdress, JSON.stringify(ERC20), ethers.provider)
    await payoutTokenContract.connect(deployer).transfer(user.address, utils.parseEther('1.5'), {from: deployer.address});
    const payoutTokenBalanceDeployer = Number(await payoutTokenContract.balanceOf(deployer.address));//2000000000000000000
    const payoutTokenBalanceUser = Number(await payoutTokenContract.balanceOf(user.address));//40000000
    
    const tokenContract = new ethers.Contract(principleToken.address, JSON.stringify(ERC20), ethers.provider)
    await tokenContract.connect(deployer).transfer(user.address, utils.parseEther('20'), {from: deployer.address});
    const tokenBalanceDeployer = Number(await tokenContract.balanceOf(deployer.address));//2000000000000000000
    const tokenBalanceUser = Number(await tokenContract.balanceOf(user.address));//4000000000000000000
            
    //Approve(principleToken) to deposit in frontend(user)
    const tokenSupply = await tokenContract.totalSupply();//1e+26
    await tokenContract.connect(user).approve(BondContract.address, tokenSupply, {from: user.address});
    
    // Allow to deposit from user
    await TreasuryContract.connect(user).toggleBondContract(BondContract.address, {from:user.address})

    const amount = utils.parseEther('0.1');
    const maxPrice = 50000;//>= nativePrice(37682)
    
    // Transfer(payoutToken) to TreasuryContract for testing
    const transferAmount = utils.parseEther('1');//= 1 eth
    await payoutTokenContract.connect(user).transfer(TreasuryContract.address, transferAmount, {from: user.address});

    const txd = await BondContract.connect(user).deposit(amount, maxPrice, user.address, {from:user.address});
    events = (await txd.wait()).events;   

    const bondCreatedEvent = events[7].args;
    const deposit = Number(BigNumber.from(bondCreatedEvent.deposit))
    const payout = Number(BigNumber.from(bondCreatedEvent.payout))
    const expires = Number(BigNumber.from(bondCreatedEvent.expires))
    expect(Number(amount)).to.equal(deposit);

    const blockNum = await ethers.provider.getBlockNumber()
    const expiresSol = BigNumber.from(blockNum).add(vestingTerm);
    expect(Number(expiresSol)).to.equal(expires);
    
    const bondPriceChangedEvent = events[8].args;
    const internalPrice = Number(BigNumber.from(bondPriceChangedEvent.internalPrice))
    const debtRatio = Number(BigNumber.from(bondPriceChangedEvent.debtRatio))

    const debtRatioSol = await BondContract.connect(deployer).debtRatio({from:deployer.address});
    expect(Number(debtRatioSol)).to.equal(debtRatio)

    // debtRatio=0 so that price = terms.minimumPrice;
    const priceSol = minimumPrice;
    expect(Number(priceSol)).to.equal(internalPrice)
  });
});

describe('CustomBond-deposit with one Asset', async function () {
  it('deposit(user) with one Asset, lpTokenAsFeeFlag(true)', async function () {      
    const {
      deployer, user,
      FactoryContract,
      HelperContract
    } = await setup();

    // deployer=0xb10bcC8B508174c761CFB1E7143bFE37c4fBC3a1 
    // user=0x6fD89350A94A02B003E638c889b54DAB0E251655
    // const myBalance = await ethers.provider.getBalance(deployer.address)
    // usdcAdress: "0xeb8f08a975ab53e34d8a0330e0d34de942c95926",//usdc in rinkeby = decimals=6
    // daiAddress: "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea",//Dai in rinkeby       = decimals=18

    // const principleToken = await MockTokenContract.deployed();

    await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

    const tx = await FactoryContract.connect(user).createBondAndTreasury(
      config.usdcAdress, 
      config.daiAddress,
      user.address, 
      {from:user.address}
    )

    const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
    const BondFactory = await ethers.getContractFactory('CustomBond');
    let events: any = [];
    events = (await tx.wait()).events;    
    const customTreasuryAddr = events[0].args.treasury;
    const customBondAddr = events[0].args.bond;
    const TreasuryContract = TreasuryFactory.attach(customTreasuryAddr);
    const BondContract = BondFactory.attach(customBondAddr);

    // set bond terms
    await BondContract.connect(user).setBondTerms(0, 20000, {from: user.address})//_input >= 10000, terms.vestingTerm
    await BondContract.connect(user).setBondTerms(1, 150, {from: user.address})  //_input <= 1000,  terms.maxPayout
    await BondContract.connect(user).setBondTerms(2, 2000, {from: user.address}) //                 terms.maxDebt

    // initialization bond
    const controlVariable = BigNumber.from(825000);
    const vestingTerm = BigNumber.from(46200);
    const minimumPrice = BigNumber.from(36760);
    const maxPayout = BigNumber.from(4);
    const maxDebt = utils.parseEther('1250');
    const initialDebt = utils.parseEther('400')
    await BondContract.connect(user).initializeBond(controlVariable, vestingTerm, minimumPrice, maxPayout, maxDebt, initialDebt, {from:user.address})
     
    const payoutTokenContract = new ethers.Contract(config.usdcAdress, JSON.stringify(ERC20), ethers.provider)
    await payoutTokenContract.connect(deployer).transfer(user.address, utils.parseUnits('500', await payoutTokenContract.decimals()), {from: deployer.address});
            
    //Approve(payoutToken) to deposit in frontend(user)
    const supply = await payoutTokenContract.totalSupply();//1e+26
    await payoutTokenContract.connect(user).approve(BondContract.address, supply, {from: user.address});
    
    // Allow to deposit from user
    await TreasuryContract.connect(user).toggleBondContract(BondContract.address, {from:user.address})
    
    // Transfer(payoutToken) to TreasuryContract for testing
    const transferAmount = utils.parseUnits('200', await payoutTokenContract.decimals());//= 0.002 eth
    await payoutTokenContract.connect(user).transfer(TreasuryContract.address, transferAmount, {from: user.address});

    const depositAmount = utils.parseUnits('200', await payoutTokenContract.decimals());//payoutToken(usdc)
    const maxPrice = 50000;//>= nativePrice(37682)
    console.log("====depositAmount::", Number(depositAmount))
    const txd = await BondContract.connect(user).depositWithAsset(
      depositAmount, 
      maxPrice, 
      config.daiAddress,
      user.address, 
      {from:user.address}
    );
    events = (await txd.wait()).events; 
    const bondCreatedEvent = events[19].args;
    const deposit = Number(BigNumber.from(bondCreatedEvent.deposit))
    const payout = Number(BigNumber.from(bondCreatedEvent.payout))
    const expires = Number(BigNumber.from(bondCreatedEvent.expires))
    
    const lpEvent = events[14].args;
    const lpAddress = lpEvent.lpAddress;
    const lpAmount = Number(BigNumber.from(lpEvent.lpAmount))
    expect(lpAmount).to.equal(deposit);

    const blockNum = await ethers.provider.getBlockNumber()
    const expiresSol = BigNumber.from(blockNum).add(vestingTerm);
    expect(Number(expiresSol)).to.equal(expires);
    
    const bondPriceChangedEvent = events[20].args;
    const internalPrice = Number(BigNumber.from(bondPriceChangedEvent.internalPrice))
    const debtRatio = Number(BigNumber.from(bondPriceChangedEvent.debtRatio))
    console.log("===tx bondPriceChangedEvent::", internalPrice, debtRatio);

    const debtRatioSol = await BondContract.connect(deployer).debtRatio({from:deployer.address});
    expect(Number(debtRatioSol)).to.equal(debtRatio)

    // debtRatio=0 so that price = terms.minimumPrice;
    const priceSol = minimumPrice;
    expect(Number(priceSol)).to.equal(internalPrice)
  });

  it('deposit(user) with one Asset, lpTokenAsFeeFlag(false)', async function () {      
    const {
      deployer, user,
      FactoryContract,
    } = await setup();

    await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

    const tx = await FactoryContract.connect(user).createBondAndTreasury(
      config.usdcAdress, 
      config.daiAddress,
      user.address, 
      {from:user.address}
    )

    const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
    const BondFactory = await ethers.getContractFactory('CustomBond');
    let events: any = [];
    events = (await tx.wait()).events;    
    const customTreasuryAddr = events[0].args.treasury;
    const customBondAddr = events[0].args.bond;
    const TreasuryContract = TreasuryFactory.attach(customTreasuryAddr);
    const BondContract = BondFactory.attach(customBondAddr);

    // set bond terms
    await BondContract.connect(user).setBondTerms(0, 20000, {from: user.address})//_input >= 10000, terms.vestingTerm
    await BondContract.connect(user).setBondTerms(1, 150, {from: user.address})  //_input <= 1000,  terms.maxPayout
    await BondContract.connect(user).setBondTerms(2, 2000, {from: user.address}) //                 terms.maxDebt

    // set lpTokenAsFeeFlag as false
    await BondContract.connect(user).setLPtokenAsFee(false, {from: user.address})

    // initialization bond
    const controlVariable = BigNumber.from(825000);
    const vestingTerm = BigNumber.from(46200);
    const minimumPrice = BigNumber.from(36760);
    const maxPayout = BigNumber.from(4);
    const maxDebt = utils.parseEther('1250');
    const initialDebt = utils.parseEther('400')
    await BondContract.connect(user).initializeBond(controlVariable, vestingTerm, minimumPrice, maxPayout, maxDebt, initialDebt, {from:user.address})
     
    const payoutTokenContract = new ethers.Contract(config.usdcAdress, JSON.stringify(ERC20), ethers.provider)
    await payoutTokenContract.connect(deployer).transfer(user.address, utils.parseUnits('500', await payoutTokenContract.decimals()), {from: deployer.address});
            
    //Approve(payoutToken) to deposit in frontend(user)
    const supply = await payoutTokenContract.totalSupply();//1e+26
    await payoutTokenContract.connect(user).approve(BondContract.address, supply, {from: user.address});
    
    // Allow to deposit from user
    await TreasuryContract.connect(user).toggleBondContract(BondContract.address, {from:user.address})
    
    // Transfer(payoutToken) to TreasuryContract for testing
    const transferAmount = utils.parseUnits('200', await payoutTokenContract.decimals());//= 0.002 eth
    await payoutTokenContract.connect(user).transfer(TreasuryContract.address, transferAmount, {from: user.address});

    const depositAmount = utils.parseUnits('200', await payoutTokenContract.decimals());//payoutToken(usdc)
    const maxPrice = 50000;//>= nativePrice(37682)
    console.log("====depositAmount::", Number(depositAmount))
    const txd = await BondContract.connect(user).depositWithAsset(
      depositAmount, 
      maxPrice, 
      config.daiAddress,
      user.address, 
      {from:user.address}
    );
    events = (await txd.wait()).events; 
    const bondCreatedEvent = events[19].args;
    const deposit = Number(BigNumber.from(bondCreatedEvent.deposit))
    const payout = Number(BigNumber.from(bondCreatedEvent.payout))
    const expires = Number(BigNumber.from(bondCreatedEvent.expires))
    
    const lpEvent = events[14].args;
    const lpAddress = lpEvent.lpAddress;
    const lpAmount = Number(BigNumber.from(lpEvent.lpAmount))
    expect(lpAmount).to.equal(deposit);

    const blockNum = await ethers.provider.getBlockNumber()
    const expiresSol = BigNumber.from(blockNum).add(vestingTerm);
    expect(Number(expiresSol)).to.equal(expires);
    
    const bondPriceChangedEvent = events[20].args;
    const internalPrice = Number(BigNumber.from(bondPriceChangedEvent.internalPrice))
    const debtRatio = Number(BigNumber.from(bondPriceChangedEvent.debtRatio))
    console.log("===tx bondPriceChangedEvent::", internalPrice, debtRatio);

    const debtRatioSol = await BondContract.connect(deployer).debtRatio({from:deployer.address});
    expect(Number(debtRatioSol)).to.equal(debtRatio)

    // debtRatio=0 so that price = terms.minimumPrice;
    const priceSol = minimumPrice;
    expect(Number(priceSol)).to.equal(internalPrice)
  });
});

describe('CustomBond-deposit with one Asset WETH', async function () {
  // it('deposit(user) with one Asset - WETH', async function () {      
  //   const {
  //     deployer, user,
  //     FactoryContract,
  //   } = await setup();

  //   await FactoryContract.connect(deployer).setTiersAndFees(config.tierCeilings, config.fees);

  //   const tx = await FactoryContract.connect(user).createBondAndTreasury(
  //     config.weth, 
  //     config.usdcAdress,
  //     user.address, 
  //     {from:user.address}
  //   )

  //   const TreasuryFactory = await ethers.getContractFactory('CustomTreasury');
  //   const BondFactory = await ethers.getContractFactory('CustomBond');
  //   let events: any = [];
  //   events = (await tx.wait()).events;    
  //   const customTreasuryAddr = events[0].args.treasury;
  //   const customBondAddr = events[0].args.bond;
  //   const TreasuryContract = TreasuryFactory.attach(customTreasuryAddr);
  //   const BondContract = BondFactory.attach(customBondAddr);

  //   // set bond terms
  //   await BondContract.connect(user).setBondTerms(0, 20000, {from: user.address})//_input >= 10000, terms.vestingTerm
  //   await BondContract.connect(user).setBondTerms(1, 150, {from: user.address})  //_input <= 1000,  terms.maxPayout
  //   await BondContract.connect(user).setBondTerms(2, 2000, {from: user.address}) //                 terms.maxDebt

  //   // initialization bond
  //   const controlVariable = BigNumber.from(825000);
  //   const vestingTerm = BigNumber.from(46200);
  //   const minimumPrice = BigNumber.from(36760);
  //   const maxPayout = BigNumber.from(4);
  //   const maxDebt = utils.parseEther('1250');
  //   const initialDebt = utils.parseEther('400')
  //   await BondContract.connect(user).initializeBond(controlVariable, vestingTerm, minimumPrice, maxPayout, maxDebt, initialDebt, {from:user.address})

  //   const payoutTokenContract = new ethers.Contract(config.weth, JSON.stringify(ERC20), ethers.provider)
  //   await payoutTokenContract.connect(deployer).transfer(user.address, utils.parseEther('0.5'), {from: deployer.address});
    
  //   //Approve(payoutToken) to deposit in frontend(user)
  //   const supply = await payoutTokenContract.totalSupply();//1e+26
  //   await payoutTokenContract.connect(user).approve(BondContract.address, supply, {from: user.address});
    
  //   // Allow to deposit from user
  //   await TreasuryContract.connect(user).toggleBondContract(BondContract.address, {from:user.address})
    
  //   // Transfer(payoutToken) to TreasuryContract for testing
  //   const transferAmount = utils.parseEther('0.2');//= 0.2 eth
  //   await payoutTokenContract.connect(user).transfer(TreasuryContract.address, transferAmount, {from: user.address});

  //   const depositAmount = utils.parseEther('0.2');//payoutToken(WETH)
  //   const maxPrice = 50000;//>= nativePrice(37682)
  //   console.log("====depositAmount::", Number(depositAmount))
  //   const txd = await BondContract.connect(user).depositWithAsset(
  //     depositAmount, 
  //     maxPrice, 
  //     config.usdcAdress,
  //     user.address, 
  //     {from:user.address}
  //   );
  //   events = (await txd.wait()).events; 
  //   const bondCreatedEvent = events[19].args;
  //   const deposit = Number(BigNumber.from(bondCreatedEvent.deposit))
  //   const payout = Number(BigNumber.from(bondCreatedEvent.payout))
  //   const expires = Number(BigNumber.from(bondCreatedEvent.expires))
    
  //   const lpEvent = events[14].args;
  //   const lpAddress = lpEvent.lpAddress;
  //   const lpAmount = Number(BigNumber.from(lpEvent.lpAmount))
  //   expect(lpAmount).to.equal(deposit);

  //   const blockNum = await ethers.provider.getBlockNumber()
  //   const expiresSol = BigNumber.from(blockNum).add(vestingTerm);
  //   expect(Number(expiresSol)).to.equal(expires);
    
  //   const bondPriceChangedEvent = events[20].args;
  //   const internalPrice = Number(BigNumber.from(bondPriceChangedEvent.internalPrice))
  //   const debtRatio = Number(BigNumber.from(bondPriceChangedEvent.debtRatio))
  //   console.log("===tx bondPriceChangedEvent::", internalPrice, debtRatio);

  //   const debtRatioSol = await BondContract.connect(deployer).debtRatio({from:deployer.address});
  //   expect(Number(debtRatioSol)).to.equal(debtRatio)

  //   // debtRatio=0 so that price = terms.minimumPrice;
  //   const priceSol = minimumPrice;
  //   expect(Number(priceSol)).to.equal(internalPrice)
  // });
});


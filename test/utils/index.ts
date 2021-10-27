import {Contract} from 'ethers';
import {ethers} from 'hardhat';
import crypto from 'crypto';


export async function setupUsers<T extends {[contractName: string]: Contract}>(
  addresses: string[],
  contracts: T
): Promise<({address: string} & T)[]> {
  const users: ({address: string} & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUser(address, contracts));
  }
  return users;
}

export async function setupUser<T extends {[contractName: string]: Contract}>(
  address: string,
  contracts: T
): Promise<{address: string} & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = {address};
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address));
  }
  return user as {address: string} & T;
}

export async function randomAddress() {
  const id = crypto.randomBytes(32).toString('hex');
  const privateKey = "0x" + id;
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}


const uniswapPools = {//Mainnet
  '1inchWeth': '0x26aad2da94c59524ac0d93f6d6cbf9071d7086f2',
  aaveWeth: '0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
  adxWeth: '0xd3772a963790fede65646cfdae08734a17cd0f47',
  antWeth: '0x9def9511fec79f83afcbffe4776b1d817dc775ae',
  balWeth: '0xa70d458a4d9bc0e6571565faee18a48da5c0d593',
  bandWeth: '0xf421c3f2e695c2d4c0765379ccace8ade4a480d9',
  batWeth: '0xb6909b960dbbe7392d405429eb2b3649752b4838',
  bntWeth: '0x3fd4cf9303c4bc9e13772618828712c8eac7dd2f',
  busdUsdc: '0x524847c615639e76fe7d0fe0b16be8c4eac9cf3c',
  busdUsdt: '0xa0abda1f980e03d7eadb78aed8fc1f2dd0fe83dd',
  bzrxWeth: '0xb9b752f7f4a4680eeb327ffe728f46666763a796',
  compWeth: '0xcffdded873554f362ac02f8fb1f02e5ada10516f',
  coverWeth: '0x84e99ccc19da8290a754cb015ca188676d695f0a',
  croWeth: '0x90704ac59e7e54632b0cc9d22573aecd7eb094ad',
  daiUsdc: '0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5',
  daiUsdt: '0xb20bd5d04be54f870d5c0d3ca85d82b34b836405',
  daiWeth: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
  hegicWeth: '0x1273ad5d8f3596a7a39efdb5a4b8f82e8f003fc3',
  linkWeth: '0xa2107fa5b38d9bbd2c461d6edf11b11a50f6b974',
  lrcWeth: '0x8878df9e1a7c87dcbf6d3999d997f262c05d8c70',
  manaWeth: '0x11b1f53204d03e5529f09eb3091939e4fd8c9cf3',
  mkrWeth: '0xc2adda861f89bbb333c90c492cb837741916a225',
  nmrWeth: '0xb784ced6994c928170b417bbd052a096c6fb17e2',
  ognWeth: '0xce2cc0513634cef3a7c9c257e294ef5e3092f185',
  ornWeth: '0x6c8b0dee9e90ea9f790da5daf6f5b20d23b39689',
  oxtWeth: '0x9b533f1ceaa5ceb7e5b8994ef16499e47a66312d',
  renWeth: '0x8bd1661da98ebdd3bd080f0be4e6d9be8ce9858c',
  repv2Weth: '0x8979a3ef9d540480342ac0f56e9d4c88807b1cba',
  rlcWeth: '0x6d57a53a45343187905aad6ad8ed532d105697c1',
  snxWeth: '0x43ae24960e5534731fc831386c07755a2dc33d47',
  susdWeth: '0xf80758ab42c3b07da84053fd88804bcb6baa4b5c',
  sushiWeth: '0xce84867c3c02b05dc570d0135103d3fb9cc19433',
  sxpWeth: '0xac317d14738a454ff20b191ba3504aa97173045b',
  umaWeth: '0x88d97d199b9ed37c29d846d00d443de980832a22',
  uniWeth: '0xd3d2e2692501a5c9ca623199d38826e513033a17',
  usdcUsdt: '0x3041cbd36888becc7bbcbc0045e3b1f144466f5f',
  usdcWeth: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
  wbtcUsdc: '0x004375dff511095cc5a197a54140a24efef3a416',
  wbtcWeth: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940',
  wethCrv: '0x3da1313ae46132a397d90d95b1424a9a7e3e0fce',
  wethEnj: '0xe56c60b5f9f7b5fc70de0eb79c6ee7d00efa2625',
  wethKnc: '0xf49c43ae0faf37217bdcb00df478cf793edd6687',
  wethMln: '0x15ab0333985fd1e289adf4fbbe19261454776642',
  wethSteth: '0x448a0a42f55142971bb3ea45e64528d3e4114f9e',
  wethUsdt: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
  wethZrx: '0xc6f348dd3b91a56d117ec0071c1e9b83c0996de4',
  wnxmWeth: '0x23bff8ca20aac06efdf23cee3b8ae296a30dfd27',
  yfiWeth: '0x2fdbadf3c4d5a8666bc06645b8358ab803996e28',
}
export const config = {
    dao: "0x1A621BBd762a52b01c3eF070D3317c8589c37915",//dao multisig address(for now vaultLib as test)
    treasury: "0xc3Ab493d0d06c700d9daF7Ea58aBBe12038ec474",//our dao wallet(for now my main wallet as test)
    tierCeilings: [0],
    fees: [30000],
    payoutTokenAddr: "0xeb8f08a975ab53e34d8a0330e0d34de942c95926",//usdc in rinkeby
    daiAddress: "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea",//Dai in rinkeby
    
    uniswap: {//Mainnet, kovan, rinkeby ...
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      uniswapPools,
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    },
}



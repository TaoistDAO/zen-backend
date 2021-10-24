import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
// import {node_url, accounts} from './utils/network';

// While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
if (process.env.HARDHAT_FORK) {
  process.env['HARDHAT_DEPLOY_FORK'] = process.env.HARDHAT_FORK;
}
const mnemonic = process.env.MNEMONIC;
function node(networkName: string) {
  const fallback = 'http://localhost:8545';
  const uppercase = networkName.toUpperCase();
  const uri = process.env[`ETHEREUM_NODE_${uppercase}`] || process.env.ETHEREUM_NODE || fallback;
  return uri.replace('{{NETWORK}}', networkName);
}
function accounts(networkName: string) {
  const uppercase = networkName.toUpperCase();
  const accounts = process.env[`ETHEREUM_ACCOUNTS_${uppercase}`] || process.env.ETHEREUM_ACCOUNTS || '';
  return accounts
    .split(',')
    .map((account) => account.trim())
    .filter(Boolean);
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: {mnemonic},
      // forking: {
      //   blockNumber: 12540501,
      //   url: node('mainnet'), // May 31, 2021
      // },
      chainId: 42, //42
      forking: {
        blockNumber: 27277405,
        url: node('kovan'),
      },
      // forking: process.env.MAINNET
      //   ? {
      //       url: node_url(process.env.MAINNET),
      //       blockNumber: process.env.HARDHAT_FORK_NUMBER ? parseInt(process.env.HARDHAT_FORK_NUMBER) : undefined,
      //     }
      //   : undefined,
      mining: process.env.MINING_INTERVAL
        ? {
            auto: false,
            interval: process.env.MINING_INTERVAL.split(',').map((v) => parseInt(v)) as [number, number],
          }
        : undefined,
    },
    // localhost: {
    //   url: node_url('localhost'),
    //   accounts: accounts(),
    // },
    // staging: {
    //   url: node_url('rinkeby'),
    //   accounts: accounts('rinkeby'),
    // },
    // production: {
    //   url: node_url('mainnet'),
    //   accounts: accounts('mainnet'),
    // },
    mainnet: {
      url: node('mainnet'),
      accounts: accounts('mainnet'),
    },
    rinkeby: {
      url: node('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    kovan: {
      url: node('kovan'),
      accounts: accounts('kovan'),
    },
    arbitrum: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      gasPrice: 0,
    },
  },
  namedAccounts: {
    deployer: 0,
    owner: 1,
  },
  paths: {
    sources: 'src',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 0,
  },
  solidity: {
    compilers: [
      {
        version: '0.7.5',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  // external: process.env.HARDHAT_FORK
  //   ? {
  //       deployments: {
  //         // process.env.HARDHAT_FORK will specify the network that the fork is made from.
  //         // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
  //         hardhat: ['deployments/' + process.env.HARDHAT_FORK],
  //         localhost: ['deployments/' + process.env.HARDHAT_FORK],
  //       },
  //     }
  //   : undefined,
};

export default config;

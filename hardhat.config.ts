import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import "@nomiclabs/hardhat-etherscan"
// import {node_url, accounts} from './utils/network';

const fakeMnemonic = {mnemonic: "test test test test test test test test test test test junk"};
const mnemonic = process.env.MNEMONIC;
const etherScan_api_key = process.env.ETHERSCAN_API_KEY;
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

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

const config: HardhatUserConfig = {  
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      accounts: fakeMnemonic,
      // forking: {
      //   url: node('mainnet'),
      // },
      chainId: chainIds.rinkeby,
      forking: {
        url: node('rinkeby'),
      },
    },
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
      accounts: { mnemonic},
    },
    arbitrum: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      gasPrice: 0,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },  
  etherscan: {
    apiKey: etherScan_api_key
  },
  paths: {
    sources: 'src',
    artifacts: "artifacts",
    cache: "cache",
    deploy: "deploy",
    deployments: "deployments",
    imports: "imports",
    tests: "test",
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
      {
        version: '0.8.0',
      }
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

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    ethers: { getSigners },
  } = hre;

  const deployer = (await getSigners())[0];

  const treasury = '0x31f8cc382c9898b273eff4e0b7626a6987c846e8'; 
  // const factoryStorage = '0x6828d71014d797533c3b49b6990ca1781656b71f'; 
  const subsidyRouter = '0x97fac4ea361338eab5c89792ee196da8712c9a4a';
  const dao = '0xb10bcC8B508174c761CFB1E7143bFE37c4fBC3a1';
  const factoryStorage = await get('FactoryStorage');
        
  await deploy('Factory', {
    from: deployer.address,
    args: [treasury, factoryStorage.address, subsidyRouter, dao],
    log: true,    
    skipIfAlreadyDeployed: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

func.id = 'deploy_factory'; // id required to prevent reexecution
func.tags = ['Factory'];
func.dependencies = ['FactoryStorage', 'VaultLib'];

export default func;
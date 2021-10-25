import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {config} from '../test/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    ethers: { getSigners },
    getNamedAccounts,
  } = hre;

  const deployer = (await getSigners())[0]; 
  const factoryStorage = await get('FactoryStorage');
  const subsidyRouter = await get('SubsidyRouter');
        
  await deploy('Factory', {
    from: deployer.address,
    args: [
      config.treasury, 
      factoryStorage.address, 
      subsidyRouter.address, 
      config.dao
    ],
    log: true,    
    skipIfAlreadyDeployed: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

func.id = 'deploy_factory'; // id required to prevent reexecution
func.tags = ['Factory'];
func.dependencies = ['FactoryStorage', 'SubsidyRouter'];

export default func;
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {config} from '../test/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    ethers: { getSigners },
  } = hre;

  const deployer = (await getSigners())[0]; 
  const factoryStorage = await get('FactoryStorage');
  const subsidyRouter = await get('SubsidyRouter');
  const helper = await get('Helper');
  const mockToken = await get('MockToken');

  await deploy('Factory', {
    from: deployer.address,
    args: [
      config.treasury, 
      factoryStorage.address, 
      subsidyRouter.address, 
      config.dao,
      helper.address
    ],
    log: true,    
    skipIfAlreadyDeployed: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

func.id = 'deploy_factory'; // id required to prevent reexecution
func.tags = ['Factory'];
func.dependencies = ['FactoryStorage', 'SubsidyRouter', 'Helper', 'MockToken'];

export default func;
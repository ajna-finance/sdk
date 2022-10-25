import erc20PoolFactoryJsonAbi from '../abis/ERC20PoolFactory.json';
import { CONTRACT_ERC20_POOL_FACTORY } from '../constants/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPoolFactoryContract = (web3: any) => {
  return new web3.eth.Contract(
    erc20PoolFactoryJsonAbi,
    CONTRACT_ERC20_POOL_FACTORY
  );
};

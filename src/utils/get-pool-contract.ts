import erc20PoolJsonAbi from '../abis/ERC20Pool.json';
import { CONTRACT_ERC20_POOL } from '../constants/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPoolContract = (web3: any) => {
  return new web3.eth.Contract(erc20PoolJsonAbi, CONTRACT_ERC20_POOL);
};

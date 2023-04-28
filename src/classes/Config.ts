import dotenv from 'dotenv';
import { Address } from 'types';

dotenv.config();

/**
 * manages static protocol configuration, particularly contract addresses for a single chain
 */
class Config {
  static erc20PoolFactory: Address;
  static erc721PoolFactory: Address;
  static poolUtils: Address;
  static ajnaToken: Address;

  /**
   * allows consumer to configure with their own addresses
   * @param erc20PoolFactory address of the factory contract which creates fungible pools
   * @param erc721PoolFactory address of the factory contract which creates NFT pools
   * @param poolUtils address of the readonly utility contract
   * @param ajnaToken address of the Ajna token contract
   */
  constructor(
    erc20PoolFactory: Address,
    erc721PoolFactory: Address,
    poolUtils: Address,
    ajnaToken: Address
  ) {
    Config.erc20PoolFactory = erc20PoolFactory;
    Config.erc721PoolFactory = erc721PoolFactory;
    Config.poolUtils = poolUtils;
    Config.ajnaToken = ajnaToken;
  }

  /**
   * configures addresses from known environment variables
   */
  static fromEnvironment() {
    return new Config(
      process.env.AJNA_CONTRACT_ERC20_POOL_FACTORY || '',
      process.env.AJNA_CONTRACT_ERC721_POOL_FACTORY || '',
      process.env.AJNA_POOL_UTILS || '',
      process.env.AJNA_TOKEN_ADDRESS || ''
    );
  }
}

export { Config };

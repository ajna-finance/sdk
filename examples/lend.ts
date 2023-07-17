#!/usr/bin/env ts-node

import { AjnaSDK } from '../src/classes/AjnaSDK';
import { Config } from '../src/classes/Config';
import { FungiblePool } from '../src/classes/FungiblePool';
import { Address, SdkError } from '../src/types';
import { addAccountFromKey, addAccountFromKeystore } from '../src/utils/add-account';
import { fromWad, toWad } from '../src/utils/numeric';
import { indexToPrice } from '../src/utils/pricing';
import { BigNumber, providers } from 'ethers';
import dotenv from 'dotenv';
import { MAX_FENWICK_INDEX } from '../src/constants';

dotenv.config();

// Configure from environment
const provider = new providers.JsonRpcProvider(process.env.ETH_RPC_URL);
const signerLender = process.env.LENDER_KEY
  ? addAccountFromKey(process.env.LENDER_KEY || '', provider)
  : addAccountFromKeystore(
      process.env.LENDER_KEYSTORE || '',
      provider,
      process.env.LENDER_PASSWORD || ''
    );

Config.fromEnvironment();
const ajna = new AjnaSDK(provider);
const collateralAddress = process.env.COLLATERAL_TOKEN || '0x0';
const quoteAddress = process.env.QUOTE_TOKEN || '0x0';
let pool: FungiblePool;

// Looks for pool, deploying it if it doesn't already exist
async function getPool() {
  try {
    pool = await ajna.factory.getPool(collateralAddress, quoteAddress);
    console.log('Using pool with address', pool.poolAddress);
  } catch (error) {
    pool = await deployPool(collateralAddress, quoteAddress);
    console.log('Deployed pool to', pool.poolAddress);
  }
  return pool;
}

async function deployPool(collateral: Address, quote: Address) {
  const tx = await ajna.factory.deployPool(signerLender, collateral, quote, toWad('0.05'));
  await tx.verifyAndSubmit();
  return await ajna.factory.getPool(collateralAddress, quoteAddress);
}

// Using fine-grained approval, add liquidity to the pool
async function addLiquidity(amount: BigNumber, price: BigNumber) {
  // validate the user's price
  if (price.gt(indexToPrice(1)) || price.lte(indexToPrice(MAX_FENWICK_INDEX)))
    throw new SdkError('Please provide a valid price');

  const bucket = await pool.getBucketByPrice(price);
  let tx = await pool.quoteApprove(signerLender, amount);
  await tx.verifyAndSubmit();
  tx = await bucket.addQuoteToken(signerLender, amount);
  await tx.verifyAndSubmit();
  console.log('Added', fromWad(amount), 'liquidity to bucket', bucket.index);
}

async function removeLiquidity(amount: BigNumber, price: BigNumber) {
  const bucket = await pool.getBucketByPrice(price);
  const tx = await bucket.removeQuoteToken(signerLender, amount);
  await tx.verifyAndSubmit();
  console.log('Removed liquidity from bucket', bucket.index);
}

async function updateInterest() {
  await pool.updateInterest(signerLender);
  const stats = await pool.getStats();
  console.log('Borrow rate ', fromWad(stats.borrowRate), 'after updating');
}

async function run() {
  const pool = await getPool();
  const stats = await pool.getStats();
  const prices = await pool.getPrices();
  console.log('Pool has', fromWad(stats.poolSize), 'liquidity and', fromWad(stats.debt), 'debt');
  console.log('Borrow rate', fromWad(stats.borrowRate));

  const poolPriceIndex = Math.max(prices.lupIndex, prices.hpbIndex);
  const poolPriceExists = poolPriceIndex > 0 && poolPriceIndex < MAX_FENWICK_INDEX;
  if (poolPriceExists) console.log('Pool price', fromWad(indexToPrice(poolPriceIndex)));

  const action = process.argv.length > 2 ? process.argv[2] : '';
  const deposit = process.argv.length > 3 ? toWad(process.argv[3]) : toWad('100');
  const price = process.argv.length > 4 ? toWad(process.argv[4]) : indexToPrice(poolPriceIndex);

  if (action === 'add') {
    await addLiquidity(deposit, price);
    return;
  }
  if (action === 'remove') {
    await removeLiquidity(deposit, price);
    return;
  }
  if (action === 'updateInterest') {
    await updateInterest();
    return;
  }
}

run();

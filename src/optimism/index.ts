import * as optimism from '@chainlink/optimism-utils'
import * as dotenv from 'dotenv'
import { Wallet, Contract, providers } from 'ethers'
import { getContractFactory, Targets, Versions } from '../'

export * from '@chainlink/optimism-utils'

export const loadEnv = async (): Promise<optimism.env.OptimismEnv> => {
  //   // Load env (force 'local' env in unit test)
  //   const isTest = process.argv[1].includes('jest')
  //   const networkArg = isTest ? 'local' : process.argv.slice(2)[0] || 'local'
  //   dotenv.config({ path: __dirname + `/../../env/.env.${networkArg}` })
  dotenv.config({ path: __dirname + `/../../env/.env.local` })

  const l1Provider = new providers.JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(process.env.L2_WEB3_URL)

  l1Provider.pollingInterval = 10
  l2Provider.pollingInterval = 10

  // Grab wallets for both chains
  const l1Wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', l1Provider)
  const l2Wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', l2Provider)

  return await optimism.env.OptimismEnv.new(
    optimism.utils.LOCAL_ADDRESS_MANAGER_ADDR,
    l1Wallet,
    l2Wallet,
  )
}

export const deployGateway = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20Address: string,
  l1MessengerAddress: string,
  l2MessengerAddress: string,
): Promise<{
  OVM_L1ERC20Gateway: Contract
  OVM_L2DepositedERC20: Contract
}> => {
  // Deploy L2 ERC20 token
  const Factory__OVM_L2DepositedERC20 = getContractFactory(
    'OVM_L2DepositedLinkToken',
    l2Wallet,
    Versions.v0_7,
    Targets.OVM,
  )

  const l2DepositedERC20 = await Factory__OVM_L2DepositedERC20.deploy(l2MessengerAddress)
  await l2DepositedERC20.deployTransaction.wait()
  console.log('OVM_L2DepositedERC20 deployed to:', l2DepositedERC20.address)

  // Deploy L1 ERC20 Gateway
  const Factory__OVM_L1ERC20Gateway = getContractFactory(
    'OVM_L1ERC20Gateway',
    l1Wallet,
    Versions.v0_7,
    Targets.EVM,
  )

  const l1ERC20Gateway = await Factory__OVM_L1ERC20Gateway.deploy(
    l1ERC20Address,
    l2DepositedERC20.address,
    l1MessengerAddress,
  )
  await l1ERC20Gateway.deployTransaction.wait()
  console.log('OVM_L1ERC20Gateway deployed to:', l1ERC20Gateway.address)

  // Init L2 ERC20 Gateway
  console.log('Connecting L2 WETH with L1 Deposit contract...')
  const initTx = await l2DepositedERC20.init(l1ERC20Gateway.address)
  await initTx.wait()

  return {
    OVM_L1ERC20Gateway: l1ERC20Gateway,
    OVM_L2DepositedERC20: l2DepositedERC20,
  }
}

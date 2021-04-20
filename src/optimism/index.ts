import * as dotenv from 'dotenv'
import * as optimism from '@chainlink/optimism-utils'
import { Wallet, Contract, providers, Signer, utils } from 'ethers'
import { getContractFactory, Targets, Versions } from '../'
import { deploy, deployProxy } from '../contract-defs'

export * from '@chainlink/optimism-utils'

export const loadEnv = async (envName: string = 'local'): Promise<optimism.env.OptimismEnv> => {
  // Load env configuration by name
  dotenv.config({ path: __dirname + `/../../env/.env.${envName}` })

  // Predefined AddressManager addresses
  const addressManager: { [key: string]: string } = {
    local: optimism.utils.LOCAL_ADDRESS_MANAGER_ADDR,
    kovan: optimism.utils.KOVAN_ADDRESS_MANAGER_ADDR,
    mainnet: optimism.utils.MAINNET_ADDRESS_MANAGER_ADDR,
  }

  const addressManagerAddr = process.env.ADDRESS_MANAGER_ADDR || addressManager[envName]
  if (!addressManagerAddr) throw Error(`Unknown AddressManager for network: ${envName}`)

  const l1Provider = new providers.JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new providers.JsonRpcProvider(process.env.L2_WEB3_URL)

  l1Provider.pollingInterval = 10
  l2Provider.pollingInterval = 10

  // Grab wallets for both chains
  const l1Wallet = new Wallet(process.env.PRIVATE_KEY!, l1Provider)
  const l2Wallet = l1Wallet.connect(l2Provider)

  return await optimism.env.OptimismEnv.new(addressManagerAddr, l1Wallet, l2Wallet)
}

// TODO: Fix ERROR { "reason":"cannot estimate gas; transaction may fail or may require manual gas limit","code":"UNPREDICTABLE_GAS_LIMIT" }
export const TX_OVERRIDES_OE_BUG = {
  gasPrice: utils.parseUnits('1', 'gwei'),
  gasLimit: 2_000_000,
}

export const deployGateways = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20Address: string,
  l2ERC20Address: string,
  l1MessengerAddress: string,
  l2MessengerAddress: string,
  isProxyDeployment = true,
): Promise<{
  l1ERC20Gateway: Contract
  l2ERC20Gateway: Contract
}> => {
  // Deploy L2 ERC20 Gateway
  const l2ERC20Gateway = await deployL2ERC20Gateway(l2Wallet, isProxyDeployment)

  // Deploy & Init L1 ERC20 Gateway
  const l1ERC20Gateway = await deployL1ERC20Gateway(l1Wallet, isProxyDeployment)

  const l1InitPayload = [l2ERC20Gateway.address, l1MessengerAddress, l1ERC20Address]
  const l1InitTx = await l1ERC20Gateway.initialize(...l1InitPayload)
  await l1InitTx.wait()
  console.log('OVM_L1ERC20Gateway initialized with:', l1InitPayload)

  // Init L2 ERC20 Gateway
  const l2InitPayload = [l1ERC20Gateway.address, l2MessengerAddress, l2ERC20Address]
  const l2InitTx = await l2ERC20Gateway.initialize(...l2InitPayload)
  await l2InitTx.wait()
  console.log('OVM_L2ERC20Gateway initialized with:', l2InitPayload)

  return {
    l1ERC20Gateway,
    l2ERC20Gateway,
  }
}

export const grantRole = async (l2ERC20: Contract, l2ERC20Gateway: Contract) => {
  const message = `Adding LinkTokenChild.BRIDGE_GATEWAY_ROLE to OVM_L2ERC20Gateway at: ${l2ERC20Gateway.address}`
  console.log(message)
  // Get the required gateway role
  const gatewayRole = await l2ERC20.BRIDGE_GATEWAY_ROLE()
  const grantRoleTx = await l2ERC20.grantRole(gatewayRole, l2ERC20Gateway.address)
  await grantRoleTx.wait()
}

export const deployL1ERC20Gateway = async (l1Signer: Signer, proxy: boolean = false) => {
  // Deploy L1 ERC20 Gateway
  const l1ERC20Gateway = await deploy(
    getContractFactory('OVM_L1ERC20Gateway', l1Signer, Versions.v0_7, Targets.EVM),
    'OVM_L1ERC20Gateway',
  )

  if (!proxy) return l1ERC20Gateway

  // Deploy L2 ERC20 Gateway Proxy
  const logic = l1ERC20Gateway
  return (await deployProxy(l1Signer, Targets.EVM, logic)).proxy
}

export const deployL2ERC20Gateway = async (
  l2Signer: Signer,
  isProxyDeployment: boolean = false,
) => {
  // Deploy L2 ERC20 Gateway
  const l2ERC20Gateway = await deploy(
    getContractFactory('OVM_L2ERC20Gateway', l2Signer, Versions.v0_7, Targets.OVM),
    'OVM_L2ERC20Gateway',
  )

  if (!isProxyDeployment) return l2ERC20Gateway

  // Deploy L2 ERC20 Gateway Proxy
  const logic = l2ERC20Gateway
  return (await deployProxy(l2Signer, Targets.OVM, logic)).proxy
}

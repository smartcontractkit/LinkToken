import * as optimism from '@chainlink/optimism-utils'
import * as dotenv from 'dotenv'
import { Wallet, Contract, providers, ContractFactory, Signer } from 'ethers'
import { getContractFactory, Targets, Versions } from '../'

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

export const deployGateways = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20Address: string,
  l2ERC20Address: string,
  l1MessengerAddress: string,
  l2MessengerAddress: string,
): Promise<{
  OVM_L1ERC20Gateway: Contract
  OVM_L2ERC20Gateway: Contract
}> => {
  // Deploy L2 ERC20 Gateway
  const l2ERC20Gateway = await deployL2ERC20Gateway(l2Wallet)

  // Deploy & Init L1 ERC20 Gateway
  const l1ERC20Gateway = await deployL1ERC20Gateway(l1Wallet)

  const l1InitPayload = [l2ERC20Gateway.address, l1MessengerAddress, l1ERC20Address]
  const l1InitTx = await l1ERC20Gateway.init(...l1InitPayload)
  await l1InitTx.wait()
  console.log('OVM_L1ERC20Gateway initialized with:', l1InitPayload)

  // Init L2 ERC20 Gateway
  const l2InitPayload = [l1ERC20Gateway.address, l2MessengerAddress, l2ERC20Address]
  // TODO: What to do with DevEx here? (overloaded fn)
  const l2InitTx = await l2ERC20Gateway.init_2(...l2InitPayload)
  await l2InitTx.wait()
  console.log('OVM_L2ERC20Gateway initialized with:', l2InitPayload)

  return {
    OVM_L1ERC20Gateway: l1ERC20Gateway,
    OVM_L2ERC20Gateway: l2ERC20Gateway,
  }
}

export const deployL1ERC20Gateway = (l1Signer: Signer) =>
  deploy(
    getContractFactory('OVM_L1ERC20Gateway', l1Signer, Versions.v0_7, Targets.EVM),
    'OVM_L1ERC20Gateway',
  )

export const deployL2ERC20Gateway = (l2Signer: Signer) =>
  deploy(
    getContractFactory('OVM_L2ERC20Gateway', l2Signer, Versions.v0_7, Targets.OVM),
    'OVM_L2ERC20Gateway',
  )

export const deploy = async (
  factory: ContractFactory,
  name: string,
  payload: any[] = [],
): Promise<Contract> => {
  const contract = await factory.deploy(...payload)
  await contract.deployTransaction.wait()
  await assertDeployed(contract)
  console.log(`${name} deployed to:`, contract.address)
  return contract
}

// To assert if contract is successfully deployed on OVM, we need to check
// if there is code for reported contract address. This check is necessary
// because Optimism Sequencer doesn't flag failed deployments as a failure.
export const assertDeployed = async (contract: Contract) => {
  await contract.deployed()

  const code = await contract.provider.getCode(contract.address)
  if (code && code.length > 2) return
  throw Error(`Error: Deployment unsuccessful - no code at ${contract.address}`)
}

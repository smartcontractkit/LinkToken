import * as dotenv from 'dotenv'
import { Wallet, providers, utils } from 'ethers'
import { optimism } from '../../../src'

export const loadEnv = async (envName: string = 'local'): Promise<optimism.env.OptimismEnv> => {
  // Load env configuration by name
  dotenv.config({ path: __dirname + `/../../../env/.env.${envName}` })

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
  // Fix L2 gasPrice to 1 gwei
  l2Provider.getGasPrice = () => Promise.resolve(utils.parseUnits('1', 'gwei'))

  l1Provider.pollingInterval = 10
  l2Provider.pollingInterval = 10

  // Grab wallets for both chains
  const l1Wallet = new Wallet(process.env.PRIVATE_KEY!, l1Provider)
  const l2Wallet = l1Wallet.connect(l2Provider)

  return await optimism.env.OptimismEnv.new(addressManagerAddr, l1Wallet, l2Wallet)
}

import * as dotenv from 'dotenv'
import { Wallet, providers, utils } from 'ethers'
import { optimism } from '../../../src'

// TODO: Fix ERROR { "reason":"cannot estimate gas; transaction may fail or may require manual gas limit","code":"UNPREDICTABLE_GAS_LIMIT" }
export const TX_OVERRIDES_OE_BUG: any = {
  gasPrice: utils.parseUnits('1', 'gwei'),
  gasLimit: 8_999_999,
}

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

  l1Provider.pollingInterval = 10
  l2Provider.pollingInterval = 10

  // Grab wallets for both chains
  const l1Wallet = new Wallet(process.env.PRIVATE_KEY!, l1Provider)
  const l2Wallet = l1Wallet.connect(l2Provider)

  return await optimism.env.OptimismEnv.new(addressManagerAddr, l1Wallet, l2Wallet)
}

import * as dotenv from 'dotenv'
import { Wallet, ContractFactory, Contract } from 'ethers'

import * as Def__L1ERC20Gateway from '../../fixtures/contracts/v0.7/OVM_L1ERC20Gateway.json'
import * as Def__L2DepositedERC20 from '../../build/contracts/v0.7/OVM_L2DepositedLinkToken.json'

export const loadEnv = () => {
  // Load env (force 'local' env in unit test)
  const isTest = process.argv[1].includes('jest')
  const networkArg = isTest ? 'local' : process.argv.slice(2)[0] || 'local'
  dotenv.config({ path: __dirname + `/../../env/.env.${networkArg}` })
}

export const deployGateway = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20: Contract,
  l1MessengerAddress: string,
  l2MessengerAddress: string,
): Promise<{
  OVM_L1ERC20Gateway: Contract
  OVM_L2DepositedERC20: Contract
}> => {
  // Deploy L2 ERC20 token
  const Factory__OVM_L2DepositedERC20 = new ContractFactory(
    Def__L2DepositedERC20.compilerOutput.abi,
    Def__L2DepositedERC20.compilerOutput.evm.bytecode,
    l2Wallet,
  )
  const OVM_L2DepositedERC20 = await Factory__OVM_L2DepositedERC20.deploy(l2MessengerAddress)
  await OVM_L2DepositedERC20.deployTransaction.wait()
  console.log('OVM_L2DepositedERC20 deployed to:', OVM_L2DepositedERC20.address)

  // Deploy L1 ERC20 Gateway
  const Factory__OVM_L1ERC20Gateway = new ContractFactory(
    Def__L1ERC20Gateway.compilerOutput.abi,
    Def__L1ERC20Gateway.compilerOutput.evm.bytecode,
    l1Wallet,
  )

  const OVM_L1ERC20Gateway = await Factory__OVM_L1ERC20Gateway.deploy(
    l1ERC20.address,
    OVM_L2DepositedERC20.address,
    l1MessengerAddress,
  )
  await OVM_L1ERC20Gateway.deployTransaction.wait()
  console.log('OVM_L1ERC20Gateway deployed to:', OVM_L1ERC20Gateway.address)

  // Init L2 ERC20 Gateway
  console.log('Connecting L2 WETH with L1 Deposit contract...')
  const initTx = await OVM_L2DepositedERC20.init(OVM_L1ERC20Gateway.address)
  await initTx.wait()

  return {
    OVM_L1ERC20Gateway,
    OVM_L2DepositedERC20,
  }
}

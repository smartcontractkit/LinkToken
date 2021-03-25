import { JsonRpcProvider } from 'ethers/providers'
import { Wallet, ContractFactory, Contract } from 'ethers'
const { Watcher } = require('@eth-optimism/watcher')

// Load env (force 'local' env in unit test)
import * as dotenv from 'dotenv'
const isTest = process.argv[1].includes('jest')
const networkArg = isTest ? 'local' : process.argv.slice(2)[0] || 'local'
dotenv.config({ path: __dirname + `/../env/.env.${networkArg}` })

import * as Def__ERC20 from '../fixtures/contracts/v0.7/LinkToken.json'
import * as Def__L1ERC20Gateway from '../fixtures/contracts/v0.7/OVM_L1ERC20Gateway.json'
import * as Def__L2DepositedERC20 from '../build/contracts/v0.7/OVM_L2DepositedLinkToken.json'

import { deployGateway } from '../src/optimism'

export type ConfiguredGateway = {
  L1_ERC20: Contract
  OVM_L1ERC20Gateway: Contract
  OVM_L2DepositedERC20: Contract
}

export const setupOrRetrieveGateway = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20Address?: string,
  l1ERC20GatewayAddress?: string,
  l1MessengerAddress?: string,
  l2MessengerAddress?: string,
): Promise<ConfiguredGateway> => {
  // Deploy or retrieve L1 ERC20
  let L1_ERC20: Contract
  if (!l1ERC20Address) {
    console.log('No L1 ERC20 specified--deploying a new test ERC20 on L1.')
    const L1ERC20Factory = new ContractFactory(
      Def__ERC20.compilerOutput.abi,
      Def__ERC20.compilerOutput.evm.bytecode,
      l1Wallet,
    )
    L1_ERC20 = await L1ERC20Factory.deploy()
    console.log('New L1_ERC20 deployed to:', L1_ERC20.address)
    l1ERC20Address = L1_ERC20.address
  } else {
    console.log('Connecting to existing L1 ERC20 at:', l1ERC20Address)
    L1_ERC20 = new Contract(l1ERC20Address, Def__ERC20.compilerOutput.abi, l1Wallet)
  }

  let OVM_L1ERC20Gateway: Contract
  let OVM_L2DepositedERC20: Contract
  if (!l1ERC20GatewayAddress) {
    console.log('No gateway contract specified, deploying a new one...')
    const newGateway = await deployGateway(
      l1Wallet,
      l2Wallet,
      L1_ERC20,
      l1MessengerAddress!,
      l2MessengerAddress!,
    )
    OVM_L1ERC20Gateway = newGateway.OVM_L1ERC20Gateway
    OVM_L2DepositedERC20 = newGateway.OVM_L2DepositedERC20
  } else {
    OVM_L1ERC20Gateway = new Contract(
      l1ERC20GatewayAddress,
      Def__L1ERC20Gateway.compilerOutput.abi,
      l1Wallet,
    )
    const l2ERC20GatewayAddress = await OVM_L1ERC20Gateway.l2ERC20Gateway()
    OVM_L2DepositedERC20 = new Contract(
      l2ERC20GatewayAddress,
      Def__L2DepositedERC20.compilerOutput.abi,
      l2Wallet,
    )
  }

  console.log('Completed getting full ERC20 gateway.')
  return {
    L1_ERC20,
    OVM_L1ERC20Gateway,
    OVM_L2DepositedERC20,
  }
}

export type CheckBalances = (
  l1Wallet: Wallet,
  L1_ERC20: Contract,
  l2Wallet: Wallet,
  OVM_L2DepositedERC20: Contract,
) => Promise<void>

export const depositAndWithdraw = async (checkBalances: CheckBalances) => {
  // Grab wallets for both chains
  const l1Provider = new JsonRpcProvider(process.env.L1_WEB3_URL)
  const l2Provider = new JsonRpcProvider(process.env.L2_WEB3_URL)
  const l1Wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', l1Provider)
  const l2Wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', l2Provider)

  // Grab messenger addresses
  const l1MessengerAddress = process.env.L1_MESSENGER_ADDRESS
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Grab existing addresses if specified
  let l1ERC20Address = process.env.L1_ERC20_ADDRESS
  const l1ERC20GatewayAddress = process.env.L1_ERC20_GATEWAY_ADDRESS

  const { L1_ERC20, OVM_L1ERC20Gateway, OVM_L2DepositedERC20 } = await setupOrRetrieveGateway(
    l1Wallet,
    l2Wallet,
    l1ERC20Address,
    l1ERC20GatewayAddress,
    l1MessengerAddress,
    l2MessengerAddress,
  )

  // init watcher
  const watcher = new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: l1MessengerAddress,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: l2MessengerAddress,
    },
  })

  // init CheckBalances

  const _checkBalances = () => checkBalances(l1Wallet, L1_ERC20, l2Wallet, OVM_L2DepositedERC20)

  await _checkBalances()

  // Approve
  console.log('Approving L1 deposit contract...')
  const approveTx = await L1_ERC20.approve(OVM_L1ERC20Gateway.address, 1)
  console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
  await approveTx.wait()

  // Deposit
  console.log('Depositing into L1 deposit contract...')
  const depositTx = await OVM_L1ERC20Gateway.deposit(1, { gasLimit: 1000000 })
  console.log('Deposited: https://kovan.etherscan.io/tx/' + depositTx.hash)
  await depositTx.wait()

  await _checkBalances()

  const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTx.hash)
  console.log('got L1->L2 message hash', l1ToL2msgHash)
  const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
  console.log('completed Deposit! L2 tx hash:', l2Receipt.transactionHash)

  await _checkBalances()

  // Withdraw
  console.log('Withdrawing from L1 deposit contract...')
  const withdrawalTx = await OVM_L2DepositedERC20.withdraw(1, { gasLimit: 5000000 })
  await withdrawalTx.wait()
  console.log('Withdrawal tx hash:' + withdrawalTx.hash)

  await _checkBalances()

  const [l2ToL1msgHash] = await watcher.getMessageHashesFromL2Tx(withdrawalTx.hash)
  console.log('got L2->L1 message hash', l2ToL1msgHash)
  const l1Receipt = await watcher.getL1TransactionReceipt(l2ToL1msgHash)
  console.log('completed Withdrawal! L1 tx hash:', l1Receipt.transactionHash)

  await _checkBalances()
}

const logBalances: CheckBalances = async (l1Wallet, L1_ERC20, l2Wallet, OVM_L2DepositedERC20) => {
  console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  if (L1_ERC20) {
    const l1Balance = await L1_ERC20.balanceOf(l1Wallet.address)
    console.log('L1 balance of', l1Wallet.address, 'is', l1Balance.toString())
  } else {
    console.log('no L1_ERC20 configured')
  }
  if (OVM_L2DepositedERC20) {
    const l2Balance = await OVM_L2DepositedERC20.balanceOf(l2Wallet.address)
    console.log('L2 balance of', l2Wallet.address, 'is', l2Balance.toString())
  } else {
    console.log('no OVM_L2DepositedERC20 configured')
  }
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
}

if (require.main === module) {
  console.log('Running depositAndWithdraw script...')
  const main = depositAndWithdraw
  // start script
  main(logBalances)
    .catch(console.error)
    .finally(process.exit)
}

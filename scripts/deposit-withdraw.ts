import { Wallet, Contract } from 'ethers'
import { BigNumberish } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Direction, waitForXDomainTransaction } from '@chainlink/optimism-utils/dist/watcher-utils'
import { hardhat, getContractFactory, deploy, optimism, Targets, Versions } from '../src'
import * as h from '../test/helpers'

export type ConfiguredBridge = {
  l1ERC20: Contract
  l1ERC20Gateway: Contract
  l2ERC20: Contract
  l2ERC20Gateway: Contract
}

export const setupOrRetrieveBridge = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1MessengerAddr: string,
  l2MessengerAddr: string,
  l1ERC20Addr?: string,
  l2ERC20Addr?: string,
  l1ERC20GatewayAddr?: string,
): Promise<ConfiguredBridge> => {
  // Deploy or retrieve L1 ERC20
  let l1ERC20: Contract
  const l1ERC20__Factory = getContractFactory('LinkToken', l1Wallet, Versions.v0_6, Targets.EVM)
  if (!l1ERC20Addr) {
    console.log('No L1 ERC20 specified - deploying a new test L1 ERC20 (LinkToken).')
    l1ERC20 = await deploy(l1ERC20__Factory, 'LinkToken (L1 ERC20)')
  } else {
    console.log('Connecting to an existing L1 ERC20 at:', l1ERC20Addr)
    l1ERC20 = l1ERC20__Factory.attach(l1ERC20Addr)
  }

  // Deploy or retrieve L2 ERC20
  let l2ERC20: Contract
  const l2ERC20_Factory = getContractFactory('LinkTokenChild', l2Wallet, Versions.v0_7, Targets.OVM)
  if (!l2ERC20Addr) {
    console.log('No L2 ERC20 specified - deploying a new test L2 ERC20 (LinkTokenChild).')
    l2ERC20 = await deploy(l2ERC20_Factory, 'LinkTokenChild (L2 ERC20)')
  } else {
    console.log('Connecting to an existing L2 ERC20 at:', l2ERC20Addr)
    l2ERC20 = l2ERC20_Factory.attach(l2ERC20Addr)
  }

  let l1ERC20Gateway: Contract
  let l2ERC20Gateway: Contract
  if (!l1ERC20GatewayAddr) {
    console.log('No L1 gateway specified, deploying a new L1-L2 bridge...')
    ;({ l1ERC20Gateway, l2ERC20Gateway } = await optimism.deployGateways(
      l1Wallet,
      l2Wallet,
      l1ERC20.address,
      l2ERC20.address,
      l1MessengerAddr,
      l2MessengerAddr,
    ))
    // Grant the required access (gateway role)
    console.log(`Adding access (gateway role) to OVM_L2ERC20Gateway at: ${l2ERC20Gateway.address}`)
    const addAccessTx = await l2ERC20.addAccess(l2ERC20Gateway.address)
    await addAccessTx.wait()
  } else {
    // Use the specified OVM_L1ERC20Gateway address to construct L1-L2 bridge
    l1ERC20Gateway = getContractFactory(
      'OVM_L1ERC20Gateway',
      l1Wallet,
      Versions.v0_7,
      Targets.EVM,
    ).attach(l1ERC20GatewayAddr)

    const l2ERC20GatewayAddr = await l1ERC20Gateway.l2ERC20Gateway()
    l2ERC20Gateway = getContractFactory(
      'OVM_L2ERC20Gateway',
      l2Wallet,
      Versions.v0_7,
      Targets.OVM,
    ).attach(l2ERC20GatewayAddr)
    // TODO: check l2ERC20.address matches

    // Check role
    const hasGatewayRole = await l2ERC20.hasAccess(l2ERC20Gateway.address, '')
    if (!hasGatewayRole) {
      throw Error(`OVM_L2ERC20Gateway should have access (gateway role)`)
    }
  }

  // Configured bridge
  const bridge = {
    l1ERC20,
    l1ERC20Gateway,
    l2ERC20,
    l2ERC20Gateway,
  }
  logBridge(bridge)
  return bridge
}

export type CheckBalances = (
  l1Wallet: Wallet,
  l1ERC20: Contract,
  l2Wallet: Wallet,
  l2ERC20: Contract,
) => Promise<void>

export const depositAndWithdraw = async (
  oe: optimism.env.OptimismEnv,
  checkBalances: CheckBalances,
  amount: BigNumberish = 1,
  transferAndCall: boolean = false,
) => {
  // Grab existing addresses if specified
  const l1ERC20Addr = process.env.L1_ERC20_ADDRESS
  const l2ERC20Addr = process.env.L2_ERC20_ADDRESS
  const l1ERC20GatewayAddr = process.env.L1_ERC20_GATEWAY_ADDRESS

  const bridge = await setupOrRetrieveBridge(
    oe.l1Wallet,
    oe.l2Wallet,
    oe.l1Messenger.address,
    oe.l2Messenger.address,
    l1ERC20Addr,
    l2ERC20Addr,
    l1ERC20GatewayAddr,
  )

  const _approve = transferAndCall
    ? () => {} // no approve when using transferAndCall
    : async (_token: Contract, _spenderAddr: string, _amount: BigNumberish) => {
        console.log(`Approving spender: ${_spenderAddr} for ${_amount}`)
        const approveTx = await _token.approve(_spenderAddr, _amount)
        await approveTx.wait()
        console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
        console.log()
      }

  const _checkBalances = () =>
    checkBalances(oe.l1Wallet, bridge.l1ERC20, oe.l2Wallet, bridge.l2ERC20)

  const { watcher } = oe

  await _checkBalances()

  // Approve L1 Gateway
  await _approve(bridge.l1ERC20, bridge.l1ERC20Gateway.address, amount)

  // Deposit to L1 Gateway
  console.log('Depositing into L1 gateway contract...')
  const depositTx = transferAndCall
    ? bridge.l1ERC20.transferAndCall(bridge.l1ERC20Gateway.address, amount, Buffer.from(''))
    : bridge.l1ERC20Gateway.deposit(amount)
  const receiptsDepositTx = await waitForXDomainTransaction(watcher, depositTx, Direction.L1ToL2)
  console.log('Deposited: https://kovan.etherscan.io/tx/' + receiptsDepositTx.tx.hash)
  console.log('Completed Deposit! L2 tx hash:', receiptsDepositTx.remoteTx.hash)

  await _checkBalances()

  // Approve L2 Gateway
  await _approve(bridge.l2ERC20, bridge.l2ERC20Gateway.address, amount)

  // Withdraw from L2 Gateway
  console.log('Withdrawing from L2 gateway contract...')
  const withdrawTx = transferAndCall
    ? bridge.l2ERC20.transferAndCall(bridge.l2ERC20Gateway.address, amount, Buffer.from(''))
    : bridge.l2ERC20Gateway.withdraw(amount)
  const receiptsWithdrawTx = await waitForXDomainTransaction(watcher, withdrawTx, Direction.L2ToL1)
  console.log('Withdrawal tx hash:' + receiptsWithdrawTx.tx.hash)
  console.log('Completed Withdrawal! L1 tx hash:', receiptsWithdrawTx.remoteTx.hash)

  await _checkBalances()
}

const logBalances: CheckBalances = async (l1Wallet, l1ERC20, l2Wallet, l2ERC20) => {
  console.log()
  console.log('Checking balances: ')
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  if (l1ERC20) {
    const l1Balance = await l1ERC20.balanceOf(l1Wallet.address)
    console.log('L1 balance of', l1Wallet.address, 'is', l1Balance.toString())
  } else {
    console.log('L1 ERC20 NOT configured')
  }
  if (l2ERC20) {
    const l2Balance = await l2ERC20.balanceOf(l2Wallet.address)
    console.log('L2 balance of', l2Wallet.address, 'is', l2Balance.toString())
  } else {
    console.log('L2 ERC20 NOT configured')
  }
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  console.log()
}

const logBridge = async (bridge: ConfiguredBridge) => {
  console.log()
  console.log('Full L1-L2 configured bridge: ')
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  console.log('L1 ERC20:         ', bridge.l1ERC20.address)
  console.log('L1 ERC20 Gateway: ', bridge.l1ERC20Gateway.address)
  console.log('L2 ERC20:         ', bridge.l2ERC20.address)
  console.log('L2 ERC20 Gateway: ', bridge.l2ERC20Gateway.address)
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  console.log()
}

const _run = async () => {
  // Load CLI arguments
  const { argv } = hardhat.yargs
    .env(false)
    .string('network')
    .number('amount')
    .boolean('transferAndCall')
  // Load the configuration from environment
  const targetNetwork = argv.network || 'local'
  const oe = await h.optimism.loadEnv(targetNetwork)
  // Fund L2 wallet
  await oe.depositL2(parseEther('1') as BigNumberish)
  // Start scripts
  await depositAndWithdraw(oe, logBalances, argv.amount || 1, argv.transferAndCall)
}

if (require.main === module) {
  console.log('Running depositAndWithdraw script...')
  _run().catch(console.error).finally(process.exit)
}

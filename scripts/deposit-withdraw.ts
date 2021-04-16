import { Direction, waitForXDomainTransaction } from '@chainlink/optimism-utils/dist/watcher-utils'
import { parseEther } from '@ethersproject/units'
import { Wallet, Contract, BigNumberish } from 'ethers'
import { getContractFactory, optimism, Targets, Versions } from '../src'

export type ConfiguredBridge = {
  L1_ERC20: Contract
  OVM_L1ERC20Gateway: Contract
  L2_ERC20: Contract
  OVM_L2ERC20Gateway: Contract
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
  let L1_ERC20: Contract
  const L1ERC20Factory = getContractFactory('LinkToken', l1Wallet, Versions.v0_6, Targets.EVM)
  if (!l1ERC20Addr) {
    console.log('No L1 ERC20 specified - deploying a new test L1 ERC20 (LinkToken).')
    L1_ERC20 = await optimism.deploy(L1ERC20Factory, 'LinkToken (L1 ERC20)')
  } else {
    console.log('Connecting to an existing L1 ERC20 at:', l1ERC20Addr)
    L1_ERC20 = L1ERC20Factory.attach(l1ERC20Addr)
  }

  // Deploy or retrieve L2 ERC20
  let L2_ERC20: Contract
  const L2ERC20Factory = getContractFactory('LinkTokenChild', l2Wallet, Versions.v0_7, Targets.OVM)
  if (!l2ERC20Addr) {
    console.log('No L2 ERC20 specified - deploying a new test L2 ERC20 (LinkTokenChild).')
    L2_ERC20 = await optimism.deploy(L2ERC20Factory, 'LinkTokenChild (L2 ERC20)')
  } else {
    console.log('Connecting to an existing L2 ERC20 at:', l2ERC20Addr)
    L2_ERC20 = L2ERC20Factory.attach(l2ERC20Addr)
  }
  const gatewayRole = await L2_ERC20.BRIDGE_GATEWAY_ROLE()

  let OVM_L1ERC20Gateway: Contract
  let OVM_L2ERC20Gateway: Contract
  if (!l1ERC20GatewayAddr) {
    console.log('No gateway contract specified, deploying a new one...')
    ;({ OVM_L1ERC20Gateway, OVM_L2ERC20Gateway } = await optimism.deployGateways(
      l1Wallet,
      l2Wallet,
      L1_ERC20.address,
      L2_ERC20.address,
      l1MessengerAddr,
      l2MessengerAddr,
    ))

    console.log(
      'Adding LinkTokenChild.BRIDGE_GATEWAY_ROLE to OVM_L2ERC20Gateway at ',
      OVM_L2ERC20Gateway.address,
    )
    L2_ERC20.grantRole(gatewayRole, OVM_L2ERC20Gateway.address)
  } else {
    OVM_L1ERC20Gateway = getContractFactory(
      'OVM_L1ERC20Gateway',
      l1Wallet,
      Versions.v0_7,
      Targets.EVM,
    ).attach(l1ERC20GatewayAddr)

    const l2ERC20GatewayAddr = await OVM_L1ERC20Gateway.l2ERC20Gateway()
    OVM_L2ERC20Gateway = getContractFactory(
      'OVM_L2ERC20Gateway',
      l2Wallet,
      Versions.v0_7,
      Targets.OVM,
    ).attach(l2ERC20GatewayAddr)
    // TODO: check L2_ERC20.address matches
    const hasGatewayRole = await L2_ERC20.hasRole(gatewayRole, OVM_L2ERC20Gateway.address)
    if (!hasGatewayRole)
      throw Error(`OVM_L2ERC20Gateway should have L2_ERC20.BRIDGE_GATEWAY_ROLE role`)
  }

  console.log('Completed getting full ERC20 gateway.')
  return {
    L1_ERC20,
    OVM_L1ERC20Gateway,
    L2_ERC20,
    OVM_L2ERC20Gateway,
  }
}

export type CheckBalances = (
  l1Wallet: Wallet,
  L1_ERC20: Contract,
  l2Wallet: Wallet,
  L2_ERC20: Contract,
) => Promise<void>

export const depositAndWithdraw = async (
  oe: optimism.env.OptimismEnv,
  checkBalances: CheckBalances,
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

  const _approve = async (_token: Contract, _spenderAddr: string, _amount: BigNumberish) => {
    const approveTx = await _token.approve(_spenderAddr, _amount)
    console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
    await approveTx.wait()
  }

  const _checkBalances = () =>
    checkBalances(oe.l1Wallet, bridge.L1_ERC20, oe.l2Wallet, bridge.L2_ERC20)

  await _checkBalances()

  // Approve L1 Gateway
  console.log('Approving L1 gateway contract...')
  await _approve(bridge.L1_ERC20, bridge.OVM_L1ERC20Gateway.address, 1)

  const { watcher } = oe

  // Deposit
  console.log('Depositing into L1 gateway contract...')
  const depositTx = bridge.OVM_L1ERC20Gateway.deposit(1)
  const receiptsDepositTx = await waitForXDomainTransaction(watcher, depositTx, Direction.L1ToL2)
  console.log('Deposited: https://kovan.etherscan.io/tx/' + receiptsDepositTx.tx.hash)
  console.log('completed Deposit! L2 tx hash:', receiptsDepositTx.remoteTx.hash)

  await _checkBalances()

  // Approve L2 Gateway
  console.log('Approving L2 gateway contract...')
  await _approve(bridge.L2_ERC20, bridge.OVM_L2ERC20Gateway.address, 1)

  // Withdraw
  console.log('Withdrawing from L2 deposit contract...')
  const withdrawTx = bridge.OVM_L2ERC20Gateway.withdraw(1, {
    // TODO: Fix ERROR { "reason":"cannot estimate gas; transaction may fail or may require manual gas limit","code":"UNPREDICTABLE_GAS_LIMIT" }
    gasLimit: 5000000,
  })
  const receiptsWithdrawTx = await waitForXDomainTransaction(watcher, withdrawTx, Direction.L2ToL1)
  console.log('Withdrawal tx hash:' + receiptsWithdrawTx.tx.hash)
  console.log('completed Withdrawal! L1 tx hash:', receiptsWithdrawTx.remoteTx.hash)

  await _checkBalances()
}

const logBalances: CheckBalances = async (l1Wallet, L1_ERC20, l2Wallet, L2_ERC20) => {
  console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  if (L1_ERC20) {
    const l1Balance = await L1_ERC20.balanceOf(l1Wallet.address)
    console.log('L1 balance of', l1Wallet.address, 'is', l1Balance.toString())
  } else {
    console.log('no L1_ERC20 configured')
  }
  if (L2_ERC20) {
    const l2Balance = await L2_ERC20.balanceOf(l2Wallet.address)
    console.log('L2 balance of', l2Wallet.address, 'is', l2Balance.toString())
  } else {
    console.log('no L2_ERC20 configured')
  }
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
}

const _run = async () => {
  // Load the configuration from environment
  const oe = await optimism.loadEnv()
  // Fund L2 wallet
  await oe.depositL2(parseEther('1'))
  // Start scripts
  await depositAndWithdraw(oe, logBalances)
}

if (require.main === module) {
  console.log('Running depositAndWithdraw script...')
  _run().catch(console.error).finally(process.exit)
}

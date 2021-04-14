import { Direction, waitForXDomainTransaction } from '@chainlink/optimism-utils/dist/watcher-utils'
import { parseEther } from '@ethersproject/units'
import { Wallet, Contract } from 'ethers'
import { getContractFactory, optimism, Targets, Versions } from '../src'

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
  const L1ERC20Factory = getContractFactory('LinkToken', l1Wallet, Versions.v0_6)
  if (!l1ERC20Address) {
    console.log('No L1 ERC20 specified--deploying a new test ERC20 on L1.')

    L1_ERC20 = await L1ERC20Factory.deploy()
    console.log('New L1_ERC20 deployed to:', L1_ERC20.address)
    l1ERC20Address = L1_ERC20.address
  } else {
    console.log('Connecting to existing L1 ERC20 at:', l1ERC20Address)
    L1_ERC20 = L1ERC20Factory.attach(l1ERC20Address)
  }

  let OVM_L1ERC20Gateway: Contract
  let OVM_L2DepositedERC20: Contract
  if (!l1ERC20GatewayAddress) {
    console.log('No gateway contract specified, deploying a new one...')
    const newGateway = await optimism.deployGateway(
      l1Wallet,
      l2Wallet,
      L1_ERC20.address,
      l1MessengerAddress!,
      l2MessengerAddress!,
    )
    OVM_L1ERC20Gateway = newGateway.OVM_L1ERC20Gateway
    OVM_L2DepositedERC20 = newGateway.OVM_L2DepositedERC20
  } else {
    OVM_L1ERC20Gateway = getContractFactory(
      'OVM_L1ERC20Gateway',
      l1Wallet,
      Versions.v0_7,
      Targets.EVM,
    ).attach(l1ERC20GatewayAddress)

    const l2ERC20GatewayAddress = await OVM_L1ERC20Gateway.l2ERC20Gateway()
    OVM_L2DepositedERC20 = getContractFactory(
      'OVM_L2DepositedLinkToken',
      l2Wallet,
      Versions.v0_7,
      Targets.OVM,
    ).attach(l2ERC20GatewayAddress)
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

export const depositAndWithdraw = async (
  oe: optimism.env.OptimismEnv,
  checkBalances: CheckBalances,
) => {
  // Grab existing addresses if specified
  const l1ERC20Address = process.env.L1_ERC20_ADDRESS
  const l1ERC20GatewayAddress = process.env.L1_ERC20_GATEWAY_ADDRESS

  const { L1_ERC20, OVM_L1ERC20Gateway, OVM_L2DepositedERC20 } = await setupOrRetrieveGateway(
    oe.l1Wallet,
    oe.l2Wallet,
    l1ERC20Address,
    l1ERC20GatewayAddress,
    oe.l1Messenger.address,
    oe.l2Messenger.address,
  )

  // init CheckBalances

  const _checkBalances = () =>
    checkBalances(oe.l1Wallet, L1_ERC20, oe.l2Wallet, OVM_L2DepositedERC20)

  await _checkBalances()

  // Approve
  console.log('Approving L1 gateway contract...')
  const approveTx = await L1_ERC20.approve(OVM_L1ERC20Gateway.address, 1)
  console.log('Approved: https://kovan.etherscan.io/tx/' + approveTx.hash)
  await approveTx.wait()

  const { watcher } = oe

  // Deposit
  console.log('Depositing into L1 gateway contract...')
  const depositTx = OVM_L1ERC20Gateway.deposit(1, { gasLimit: 1000000 })
  const receiptsDepositTx = await waitForXDomainTransaction(watcher, depositTx, Direction.L1ToL2)
  console.log('Deposited: https://kovan.etherscan.io/tx/' + receiptsDepositTx.tx.hash)
  console.log('completed Deposit! L2 tx hash:', receiptsDepositTx.remoteTx.hash)

  await _checkBalances()

  // Withdraw
  console.log('Withdrawing from L2 deposit contract...')
  const withdrawTx = OVM_L2DepositedERC20.withdraw(1, { gasLimit: 5000000 })
  const receiptsWithdrawTx = await waitForXDomainTransaction(watcher, withdrawTx, Direction.L2ToL1)
  console.log('Withdrawal tx hash:' + receiptsWithdrawTx.tx.hash)
  console.log('completed Withdrawal! L1 tx hash:', receiptsWithdrawTx.remoteTx.hash)

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

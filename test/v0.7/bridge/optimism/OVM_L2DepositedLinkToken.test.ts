import { expect } from 'chai'
import { Wallet, Contract, ContractFactory, Signer, providers } from 'ethers'
import { getContractFactory, Targets, Versions, optimism } from '../../../../src'
import * as h from '../../../helpers'

import { shouldBehaveLikeERC677Token } from '../../../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../../../behavior/LinkToken'

export class OVM_L2DepositedLinkTokenTest__factory {
  readonly signer: Signer
  readonly target: Targets
  constructor(signer?: Signer, target: Targets = Targets.EVM) {
    this.signer = signer || ({} as Signer)
    this.target = target
  }

  deploy(...args: Array<any>): Promise<Contract> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      // Deploy l2CrossDomainMessenger
      const messengerMock = await getContractFactory(
        'OVM_CrossDomainMessengerMock',
        this.signer,
        Versions.v0_7,
        this.target,
      ).deploy()
      await messengerMock.deployTransaction.wait()
      const fake_l2CrossDomainMessenger = messengerMock.address

      // Deploy l2Token with l2CrossDomainMessenger
      const l2Token = await getContractFactory(
        'OVM_L2DepositedLinkTokenMock',
        this.signer,
        Versions.v0_7,
        this.target,
      ).deploy(fake_l2CrossDomainMessenger)
      await l2Token.deployTransaction.wait()
      // Init l2Token with l1TokenGateway
      const address = await this.signer.getAddress()
      const fake_l1TokenGateway = address
      const initTx = await l2Token.init(fake_l1TokenGateway)
      await initTx.wait()

      // Mock deposit $$$
      const finalizeDepositTx = await l2Token.mockFinalizeDeposit(address, initBalance)
      await finalizeDepositTx.wait()

      return l2Token
    }

    return _deploy()
  }

  connect(signer: Signer): OVM_L2DepositedLinkTokenTest__factory {
    return new OVM_L2DepositedLinkTokenTest__factory(signer)
  }
}

const OVM_EOACodeHashSet_PUBLIC_ABI = [
  'owner',
  'transferOwnership',
  'acceptOwnership',
  'containsEOACodeHash',
  'addEOACodeHash',
  'removeEOACodeHash',
]
const Abs_L2DepositedToken_PUBLIC_ABI = [
  'messenger',
  'l1TokenGateway',
  'init',
  'getFinalizeWithdrawalL1Gas',
  'withdraw',
  'withdrawTo',
  'withdrawToUnsafe',
  'finalizeDeposit',
]
const OVM_L2DepositedLinkTokenMock_PUBLIC_ABI = ['mockFinalizeDeposit']
const EXTRA_PUBLIC_ABI = [
  'decreaseAllowance',
  'increaseAllowance',
  ...OVM_EOACodeHashSet_PUBLIC_ABI,
  ...Abs_L2DepositedToken_PUBLIC_ABI,
  ...OVM_L2DepositedLinkTokenMock_PUBLIC_ABI,
]

describe(`OVM_L2DepositedLinkToken ${Versions.v0_7}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) => {
    if (name === 'LinkToken' || name === 'Token677') {
      return (new OVM_L2DepositedLinkTokenTest__factory(
        signer,
        Targets.EVM,
      ) as unknown) as ContractFactory
    }
    return getContractFactory(name, signer, Versions.v0_6)
  }
  const _getReasonStr = (reason: string) => reason

  shouldBehaveLikeERC677Token(_getContractFactory, _getReasonStr)
  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, EXTRA_PUBLIC_ABI)

  describe(`OVM_L2DepositedLinkToken ${Versions.v0_7} @integration`, () => {
    // Skip if not OVM integration test
    ;(h.isIntegration() ? describe : describe.skip)('withdrawal safety', () => {
      // Load the configuration from environment
      optimism.loadEnv()

      const provider = new providers.JsonRpcProvider(process.env.L2_WEB3_URL)
      const wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', provider)
      let l2Token: Contract

      before(async function () {
        this.timeout(20000)
        l2Token = await new OVM_L2DepositedLinkTokenTest__factory(wallet, Targets.OVM).deploy()
      })

      it('can withdraw (all fn) as EOA contract', async () => {
        const amount = '10'
        const withdrawTx = await l2Token.withdraw(amount)
        await withdrawTx.wait()

        const withdrawToTx = await l2Token.withdrawTo(wallet.address, amount)
        await withdrawToTx.wait()

        const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(wallet.address, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(wallet.address)
        expect(balance).to.equal('999999999999999999999999970')
      }).timeout(20000)

      it('can withdrawTo an empty (unseen) account', async () => {
        const emptyAccPK = '0x' + '12345678'.repeat(8)
        const emptyAccWallet = new Wallet(emptyAccPK, provider)

        const amount = '10'
        const withdrawToTx = await l2Token.withdrawTo(emptyAccWallet.address, amount)
        await withdrawToTx.wait()

        const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(emptyAccWallet.address, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(wallet.address)
        expect(balance).to.equal('999999999999999999999999950')
      }).timeout(10000)

      it("can't withdrawTo contract", async () => {
        const contractAddr = l2Token.address

        const amount = '10'
        const withdrawToTx = await l2Token.withdrawTo(contractAddr, amount, {
          // TODO: Fix ERROR { "reason":"cannot estimate gas; transaction may fail or may require manual gas limit","code":"UNPREDICTABLE_GAS_LIMIT" }
          gasLimit: 1_000_000,
        })

        // revert: Unsafe withdraw to contract
        await h.txRevert(withdrawToTx.wait())
      }).timeout(10000)

      it('can withdrawToUnsafe contract', async () => {
        const contractAddr = l2Token.address

        const amount = '10'
        const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(contractAddr, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(wallet.address)
        expect(balance).to.equal('999999999999999999999999940')
      }).timeout(10000)
    })
  })
})

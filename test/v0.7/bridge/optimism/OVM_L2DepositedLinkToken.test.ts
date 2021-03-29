import { Wallet, ContractFactory, Contract, Signer } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'
import { OVML2DepositedLinkToken as OVM_L2DepositedLinkToken } from '../../../../build/ethers/v0.7/OVML2DepositedLinkToken'
import { OVML2DepositedLinkTokenMock__factory as OVM_L2DepositedLinkTokenMock__factory } from '../../../../build/ethers/v0.7/factories/OVML2DepositedLinkTokenMock__factory'
import { OVML2CrossDomainMessengerMock__factory as OVM_L2CrossDomainMessengerMock__factory } from '../../../../build/ethers/v0.7/factories/OVML2CrossDomainMessengerMock__factory'
import { loadEnv } from '../../../../src/optimism'
import * as h from '../../../helpers'
import { LinkReceiver__factory } from '../../../../build/ethers/v0.7/factories/LinkReceiver__factory'
import { Token677ReceiverMock__factory } from '../../../../build/ethers/v0.7/factories/Token677ReceiverMock__factory'
import { NotERC677Compatible__factory } from '../../../../build/ethers/v0.7/factories/NotERC677Compatible__factory'

import { shouldBehaveLikeERC677Token } from '../../../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../../../behavior/LinkToken'

export class OVM_L2DepositedLinkTokenTest__factory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  deploy(...args: Array<any>): Promise<OVM_L2DepositedLinkToken> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      const address = await this.signer.getAddress()
      const fake_l1TokenGateway = address

      const OVM_L2CrossDomainMessengerMock = await new OVM_L2CrossDomainMessengerMock__factory()
        .connect(this.signer)
        .deploy()
      await OVM_L2CrossDomainMessengerMock.deployTransaction.wait()
      const fake_l2CrossDomainMessenger = OVM_L2CrossDomainMessengerMock.address

      const LINK = await new OVM_L2DepositedLinkTokenMock__factory()
        .connect(this.signer)
        .deploy(fake_l2CrossDomainMessenger)
      await LINK.deployTransaction.wait()

      const initTx = await LINK.init(fake_l1TokenGateway)
      await initTx.wait()

      const finalizeDepositTx = await LINK.mockFinalizeDeposit(address, initBalance)
      await finalizeDepositTx.wait()
      return LINK
    }
    return _deploy()
  }

  connect(signer: Signer): OVM_L2DepositedLinkTokenTest__factory {
    return new OVM_L2DepositedLinkTokenTest__factory(signer)
  }
}

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
const v6_EXTRA_PUBLIC_ABI = [
  'decreaseAllowance',
  'increaseAllowance',
  ...OVM_L2DepositedLinkTokenMock_PUBLIC_ABI,
  ...Abs_L2DepositedToken_PUBLIC_ABI,
]

describe('OVM_L2DepositedLinkToken v0.7', () => {
  shouldBehaveLikeERC677Token(
    (new OVM_L2DepositedLinkTokenTest__factory() as unknown) as ContractFactory,
    new Token677ReceiverMock__factory(),
    new NotERC677Compatible__factory(),
  )
  shouldBehaveLikeLinkToken(
    (new OVM_L2DepositedLinkTokenTest__factory() as unknown) as ContractFactory,
    new LinkReceiver__factory(),
    new Token677ReceiverMock__factory(),
    new NotERC677Compatible__factory(),
    v6_EXTRA_PUBLIC_ABI,
  )

  // Skip if not OVM integration test
  ;(h.isIntegrationOVM() ? describe : describe.skip)('withdrawal safety', () => {
    // Load the configuration from environment
    loadEnv()

    const provider = new JsonRpcProvider(process.env.L2_WEB3_URL)
    const wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', provider)
    let l2Token: Contract

    beforeEach(async () => {
      l2Token = await new OVM_L2DepositedLinkTokenTest__factory(wallet).deploy()
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
      expect(balance.toString()).toEqual('999999999999999999999999970')
    })

    it('can withdrawTo an empty (unseen) account', async () => {
      const emptyAccPK = '0x' + '12345678'.repeat(8)
      const emptyAccWallet = new Wallet(emptyAccPK, provider)

      const amount = '10'
      const withdrawToTx = await l2Token.withdrawTo(emptyAccWallet.address, amount)
      await withdrawToTx.wait()

      const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(emptyAccWallet.address, amount)
      await withdrawToUnsafeTx.wait()

      const balance = await l2Token.balanceOf(wallet.address)
      expect(balance.toString()).toEqual('999999999999999999999999980')
    })

    it("can't withdrawTo contract", async () => {
      const contractAddr = l2Token.address

      const amount = '10'
      const withdrawToTx = await l2Token.withdrawTo(contractAddr, amount)

      // revert: Unsafe withdraw to contract
      await h.txRevert(withdrawToTx.wait())
    })

    it('can withdrawToUnsafe contract', async () => {
      const contractAddr = l2Token.address

      const amount = '10'
      const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(contractAddr, amount)
      await withdrawToUnsafeTx.wait()

      const balance = await l2Token.balanceOf(wallet.address)
      expect(balance.toString()).toEqual('999999999999999999999999990')
    })
  })
})

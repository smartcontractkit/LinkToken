import { ContractFactory, Signer } from 'ethers'
import { OVML2DepositedLinkToken as OVM_L2DepositedLinkToken } from '../../../../build/ethers/v0.7/OVML2DepositedLinkToken'
import { OVML2DepositedLinkTokenMock__factory as OVM_L2DepositedLinkTokenMock__factory } from '../../../../build/ethers/v0.7/factories/OVML2DepositedLinkTokenMock__factory'
import { LinkReceiver__factory } from '../../../../build/ethers/v0.7/factories/LinkReceiver__factory'
import { Token677ReceiverMock__factory } from '../../../../build/ethers/v0.7/factories/Token677ReceiverMock__factory'
import { NotERC677Compatible__factory } from '../../../../build/ethers/v0.7/factories/NotERC677Compatible__factory'

import { shouldBehaveLikeERC677Token } from '../../../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../../../behavior/LinkToken'

import { depositAndWithdraw, CheckBalances } from '../../../../scripts/deposit-withdraw'

export class OVM_L2DepositedLinkTokenTest__factory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  deploy(...args: Array<any>): Promise<OVM_L2DepositedLinkToken> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      const address = await this.signer.getAddress()
      const fake_l2CrossDomainMessenger = address
      const fake_l1TokenGateway = address

      const LINK = await new OVM_L2DepositedLinkTokenMock__factory()
        .connect(this.signer)
        .deploy(fake_l2CrossDomainMessenger)

      await LINK.init(fake_l1TokenGateway)
      await LINK.mockFinalizeDeposit(address, initBalance)
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

  describe('OVM_L1ERC20Gateway', () => {
    const itif = (condition: boolean) => (condition ? it : it.skip)
    // Run this only if local env setup to accept the test
    const isIntegrationOVM =
      process.env.USE_OVM === 'true' && process.env.TEST_INTEGRATION === 'true'

    itif(isIntegrationOVM)('deposit L1->L2, withdraw L2->L1 @integration', async () => {
      let step = 0
      const _checkBalances: CheckBalances = async (
        l1Wallet,
        L1_ERC20,
        l2Wallet,
        OVM_L2DepositedERC20,
      ) => {
        const _expect = async (_l1Balance: string, _l2Balance: string) => {
          const l1Balance = await L1_ERC20.balanceOf(l1Wallet.address)
          expect(l1Balance.toString()).toEqual(_l1Balance)

          const l2Balance = await OVM_L2DepositedERC20.balanceOf(l2Wallet.address)
          expect(l2Balance.toString()).toEqual(_l2Balance)
        }

        switch (step++) {
          case 0:
            return await _expect('1000000000000000000000000000', '0')
          case 1:
            return await _expect('999999999999999999999999999', '0')
          case 2:
            return await _expect('999999999999999999999999999', '1')
          case 3:
            return await _expect('999999999999999999999999999', '0')
          case 4:
            return await _expect('1000000000000000000000000000', '0')
          default:
            return expect(step).toBeLessThanOrEqual(4)
        }
      }

      // run test
      await depositAndWithdraw(_checkBalances)
    })
  })
})

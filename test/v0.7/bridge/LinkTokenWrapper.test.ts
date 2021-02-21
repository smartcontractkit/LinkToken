import { ContractFactory, Signer } from 'ethers'
import { StandardTokenMockFactory } from '../../../build/ethers/v0.7/StandardTokenMockFactory'
import { LinkTokenWrapperFactory } from '../../../build/ethers/v0.7/LinkTokenWrapperFactory'
import { LinkTokenWrapper } from '../../../build/ethers/v0.7/LinkTokenWrapper'
import { LinkReceiverFactory } from '../../../build/ethers/v0.7/LinkReceiverFactory'
import { Token677ReceiverMockFactory } from '../../../build/ethers/v0.7/Token677ReceiverMockFactory'
import { NotERC677CompatibleFactory } from '../../../build/ethers/v0.7/NotERC677CompatibleFactory'

import { shouldBehaveLikeERC677Token } from '../../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../../behavior/LinkToken'

export class LinkTokenWrapperTestFactory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  deploy(...args: Array<any>): Promise<LinkTokenWrapper> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      const address = await this.signer.getAddress()
      const source = await new StandardTokenMockFactory()
        .connect(this.signer)
        .deploy(address, initBalance)

      const wLINK = await new LinkTokenWrapperFactory().connect(this.signer).deploy(source.address)
      await source.approve(wLINK.address, initBalance)
      await wLINK.deposit(initBalance)

      return wLINK
    }
    return _deploy()
  }

  connect(signer: Signer): LinkTokenWrapperTestFactory {
    return new LinkTokenWrapperTestFactory(signer)
  }
}

const ISWAP_PUBLIC_ABI = ['source', 'target', 'deposit', 'withdraw']
const v6_EXTRA_PUBLIC_ABI = ['decreaseAllowance', 'increaseAllowance', ...ISWAP_PUBLIC_ABI]

describe('LinkTokenWrapper v0.7', () => {
  shouldBehaveLikeERC677Token(
    (new LinkTokenWrapperTestFactory() as unknown) as ContractFactory,
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
  )
  shouldBehaveLikeLinkToken(
    (new LinkTokenWrapperTestFactory() as unknown) as ContractFactory,
    new LinkReceiverFactory(),
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
    v6_EXTRA_PUBLIC_ABI,
  )
})

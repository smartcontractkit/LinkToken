import { LinkTokenFactory } from '../../build/ethers/v0.6/LinkTokenFactory'
import { LinkReceiverFactory } from '../../build/ethers/v0.6/LinkReceiverFactory'
import { Token677ReceiverMockFactory } from '../../build/ethers/v0.6/Token677ReceiverMockFactory'
import { NotERC677CompatibleFactory } from '../../build/ethers/v0.6/NotERC677CompatibleFactory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token.behavior'
import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken.behavior'

const v6_EXTRA_PUBLIC_ABI = ['decreaseAllowance', 'increaseAllowance']

describe('LinkToken v0.6', () => {
  shouldBehaveLikeERC677Token(
    new LinkTokenFactory(),
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
  )
  shouldBehaveLikeLinkToken(
    new LinkTokenFactory(),
    new LinkReceiverFactory(),
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
    v6_EXTRA_PUBLIC_ABI,
  )
})

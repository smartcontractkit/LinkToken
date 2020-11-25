import { LinkTokenFactory } from '../../build/ethers/v0.4/LinkTokenFactory'
import { LinkReceiverFactory } from '../../build/ethers/v0.4/LinkReceiverFactory'
import { Token677ReceiverMockFactory } from '../../build/ethers/v0.4/Token677ReceiverMockFactory'
import { NotERC677CompatibleFactory } from '../../build/ethers/v0.4/NotERC677CompatibleFactory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token.behavior'
import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken.behavior'

const v4_EXTRA_PUBLIC_ABI: string[] = []

describe('LinkToken v0.4', () => {
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
    v4_EXTRA_PUBLIC_ABI,
  )
})

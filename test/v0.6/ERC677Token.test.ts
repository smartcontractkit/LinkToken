import { Token677Factory } from '../../build/ethers/v0.6/Token677Factory'
import { Token677ReceiverMockFactory } from '../../build/ethers/v0.6/Token677ReceiverMockFactory'
import { NotERC677CompatibleFactory } from '../../build/ethers/v0.6/NotERC677CompatibleFactory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token.behavior'

describe('ERC677Token v0.6', () => {
  shouldBehaveLikeERC677Token(
    new Token677Factory(),
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
  )
})

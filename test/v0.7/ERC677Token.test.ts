import { Token677Factory } from '../../build/ethers/v0.7/Token677Factory'
import { Token677ReceiverMockFactory } from '../../build/ethers/v0.7/Token677ReceiverMockFactory'
import { NotERC677CompatibleFactory } from '../../build/ethers/v0.7/NotERC677CompatibleFactory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'

describe('ERC677Token v0.7', () => {
  shouldBehaveLikeERC677Token(
    new Token677Factory(),
    new Token677ReceiverMockFactory(),
    new NotERC677CompatibleFactory(),
  )
})

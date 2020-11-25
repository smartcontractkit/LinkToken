import { Token677__factory } from '../../build/ethers/v0.7/factories/Token677__factory'
import { Token677ReceiverMock__factory } from '../../build/ethers/v0.7/factories/Token677ReceiverMock__factory'
import { NotERC677Compatible__factory } from '../../build/ethers/v0.7/factories/NotERC677Compatible__factory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'

describe('ERC677Token v0.7', () => {
  shouldBehaveLikeERC677Token(
    new Token677__factory(),
    new Token677ReceiverMock__factory(),
    new NotERC677Compatible__factory(),
  )
})

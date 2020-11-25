import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { LinkToken__factory } from '../../build/types/v0.6/factories/LinkToken__factory'
import { LinkReceiver__factory } from '../../build/types/v0.6/factories/LinkReceiver__factory'
import { Token677ReceiverMock__factory } from '../../build/types/v0.6/factories/Token677ReceiverMock__factory'
import { NotERC677Compatible__factory } from '../../build/types/v0.6/factories/NotERC677Compatible__factory'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'

const v6_EXTRA_PUBLIC_ABI = ['decreaseAllowance', 'increaseAllowance']

describe('LinkToken v0.6', () => {
  shouldBehaveLikeERC677Token(
    new LinkToken__factory(),
    new Token677ReceiverMock__factory(),
    new NotERC677Compatible__factory(),
  )
  shouldBehaveLikeLinkToken(
    new LinkToken__factory(),
    new LinkReceiver__factory(),
    new Token677ReceiverMock__factory(),
    new NotERC677Compatible__factory(),
    v6_EXTRA_PUBLIC_ABI,
  )
})

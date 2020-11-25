import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { StandardTokenMock__factory } from '../../../build/types/v0.6/factories/StandardTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.6', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMock__factory())
})

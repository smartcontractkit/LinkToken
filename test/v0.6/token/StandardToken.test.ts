import { StandardTokenMockFactory } from '../../../build/ethers/v0.6/StandardTokenMockFactory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken.behavior'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken.behavior'

describe('StandardToken v0.6', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMockFactory())
  shouldBehaveLikeStandardToken(new StandardTokenMockFactory())
})

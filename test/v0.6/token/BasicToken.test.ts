import { StandardTokenMockFactory } from '../../../build/ethers/v0.6/StandardTokenMockFactory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken.behavior'

describe('BasicToken v0.6', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMockFactory())
})

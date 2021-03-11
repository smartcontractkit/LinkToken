import { StandardTokenMockFactory } from '../../../build/ethers/v0.7/StandardTokenMockFactory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.7', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMockFactory())
})

import { BasicTokenMockFactory } from '../../../build/ethers/v0.4/BasicTokenMockFactory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.4', () => {
  shouldBehaveLikeBasicToken(new BasicTokenMockFactory())
})

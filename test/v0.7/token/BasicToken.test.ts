import { StandardTokenMock__factory } from '../../../build/ethers/v0.7/factories/StandardTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.7', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMock__factory())
})

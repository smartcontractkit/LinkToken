import { StandardTokenMock__factory } from '../../../build/ethers/v0.6/factories/StandardTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.6', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMock__factory())
})

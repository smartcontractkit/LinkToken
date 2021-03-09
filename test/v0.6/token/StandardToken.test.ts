import { StandardTokenMock__factory } from '../../../build/ethers/v0.6/factories/StandardTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'

describe('StandardToken v0.6', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMock__factory())
  shouldBehaveLikeStandardToken(new StandardTokenMock__factory())
})

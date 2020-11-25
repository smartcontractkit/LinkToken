import { StandardTokenMock__factory } from '../../../build/types/v0.4/factories/StandardTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'

describe('StandardToken v0.4', () => {
  shouldBehaveLikeBasicToken(new StandardTokenMock__factory())
  shouldBehaveLikeStandardToken(new StandardTokenMock__factory())
})

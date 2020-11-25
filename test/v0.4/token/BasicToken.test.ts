import { BasicTokenMock__factory } from '../../../build/types/v0.4/factories/BasicTokenMock__factory'
import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

describe('BasicToken v0.4', () => {
  shouldBehaveLikeBasicToken(new BasicTokenMock__factory())
})

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'
import { REVERT_REASON_EMPTY } from '../../helpers'

const VERSION = 'v0.4'

describe(`StandardToken ${VERSION}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'StandardTokenMock' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, VERSION)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
  shouldBehaveLikeStandardToken(_getContractFactory, _getReasonStr)
})

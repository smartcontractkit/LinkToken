import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'
import { REVERT_REASON_EMPTY } from '../../helpers'

describe(`StandardToken ${Versions.v0_4}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'StandardTokenMock' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_4)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
  shouldBehaveLikeStandardToken(_getContractFactory, _getReasonStr)
})

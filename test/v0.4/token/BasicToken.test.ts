import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { REVERT_REASON_EMPTY } from '../../helpers'

describe(`BasicToken ${Versions.v0_4}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, Versions.v0_4)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
})

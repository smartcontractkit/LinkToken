import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { REVERT_REASON_EMPTY } from '../../helpers'

const VERSION = 'v0.4'

describe(`BasicToken ${VERSION}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, VERSION)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
})

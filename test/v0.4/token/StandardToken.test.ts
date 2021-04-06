import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'
import * as h from '../../helpers'

h.describes().HH(`StandardToken ${Versions.v0_4}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'StandardTokenMock' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_4)

  shouldBehaveLikeBasicToken(_getContractFactory, h.revertShim(Versions.v0_4))
  shouldBehaveLikeStandardToken(_getContractFactory, h.revertShim(Versions.v0_4))
})

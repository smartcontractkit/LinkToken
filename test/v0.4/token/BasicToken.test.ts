import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import * as h from '../../helpers'

h.describes().HH(`BasicToken ${Versions.v0_4}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, Versions.v0_4)

  shouldBehaveLikeBasicToken(_getContractFactory, h.revertShim(Versions.v0_4))
})

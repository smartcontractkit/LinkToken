import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'
import * as h from '../../helpers'

h.describes().HH(`StandardToken ${Versions.v0_6}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'Token20', StandardTokenMock: 'Token20' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_6)

  shouldBehaveLikeBasicToken(_getContractFactory, h.revertShim())
  shouldBehaveLikeStandardToken(_getContractFactory, h.revertShim())
})

import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'
import { shouldBehaveLikeStandardToken } from '../../behavior/token/StandardToken'

describe(`StandardToken ${Versions.v0_6}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'StandardTokenMock' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_6)
  const _getReasonStr = (reason: string) => reason

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
  shouldBehaveLikeStandardToken(_getContractFactory, _getReasonStr)
})

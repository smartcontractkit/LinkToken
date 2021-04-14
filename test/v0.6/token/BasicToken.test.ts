import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../../src'

import { shouldBehaveLikeBasicToken } from '../../behavior/token/BasicToken'

const VERSION = 'v0.6'

describe(`BasicToken ${VERSION}`, () => {
  const overrides: Record<string, string> = { BasicTokenMock: 'StandardTokenMock' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, VERSION)

  const _getReasonStr = (reason: string) => reason

  shouldBehaveLikeBasicToken(_getContractFactory, _getReasonStr)
})

import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../src'

import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'

const VERSION = 'v0.6'
const v6_EXTRA_PUBLIC_ABI = ['decreaseAllowance', 'increaseAllowance']

describe(`LinkToken ${VERSION}`, () => {
  const overrides: Record<string, string> = { Token677: 'LinkToken' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, VERSION)

  const _getReasonStr = (reason: string) => reason
  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, v6_EXTRA_PUBLIC_ABI)
})

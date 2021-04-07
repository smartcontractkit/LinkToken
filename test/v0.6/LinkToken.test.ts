import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'

import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'

const v6_EXTRA_PUBLIC_ABI = ['decreaseAllowance', 'increaseAllowance']

describe(`LinkToken ${Versions.v0_6}`, () => {
  const overrides: Record<string, string> = { Token677: 'LinkToken' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_6)

  const _getReasonStr = (reason: string) => reason
  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, v6_EXTRA_PUBLIC_ABI)
})

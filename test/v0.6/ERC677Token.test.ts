import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../src'

import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'

const VERSION = 'v0.6'

describe(`ERC677Token ${VERSION}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, VERSION)
  const _getReasonStr = (reason: string) => reason

  shouldBehaveLikeERC677Token(_getContractFactory, _getReasonStr)
})

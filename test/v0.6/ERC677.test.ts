import { ethers } from 'ethers'
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'

import { shouldBehaveLikeERC677 } from '../behavior/ERC677'
import * as h from '../helpers'

h.describes().HH(`ERC677 ${Versions.v0_6}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, Versions.v0_6)

  shouldBehaveLikeERC677(_getContractFactory, h.revertShim())
})

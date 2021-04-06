import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'
import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'
import * as h from '../helpers'

h.describes.HH(`ERC677Token ${Versions.v0_4}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, Versions.v0_4)

  shouldBehaveLikeERC677Token(_getContractFactory, h.revertShim(Versions.v0_4))
})

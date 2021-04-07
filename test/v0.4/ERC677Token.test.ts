import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'
import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'
import { REVERT_REASON_EMPTY } from '../helpers'

describe(`ERC677Token ${Versions.v0_4}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, Versions.v0_4)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeERC677Token(_getContractFactory, _getReasonStr)
})

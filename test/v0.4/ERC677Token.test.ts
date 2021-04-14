import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../src'
import { shouldBehaveLikeERC677Token } from '../behavior/ERC677Token'
import { REVERT_REASON_EMPTY } from '../helpers'

const VERSION = 'v0.4'

describe(`ERC677Token ${VERSION}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(name, signer, VERSION)
  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY

  shouldBehaveLikeERC677Token(_getContractFactory, _getReasonStr)
})

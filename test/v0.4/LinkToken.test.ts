import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'

import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'
import { REVERT_REASON_EMPTY } from '../helpers'

const v4_EXTRA_PUBLIC_ABI: string[] = []

describe(`LinkToken ${Versions.v0_4}`, () => {
  const overrides: Record<string, string> = { Token677: 'LinkToken' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_4)

  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY
  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, v4_EXTRA_PUBLIC_ABI)
})

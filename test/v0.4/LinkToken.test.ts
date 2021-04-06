import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory } from '../../src'

import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'
import { REVERT_REASON_EMPTY } from '../helpers'

const VERSION = 'v0.4'
const v4_EXTRA_PUBLIC_ABI: string[] = []

describe(`LinkToken ${VERSION}`, () => {
  const overrides: Record<string, string> = { Token677: 'LinkToken' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, VERSION)

  const _getReasonStr = (_: string) => REVERT_REASON_EMPTY
  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, v4_EXTRA_PUBLIC_ABI)
})

import { Signer } from '@ethersproject/abstract-signer'
import { getContractFactory, Versions } from '../../src'

import { shouldBehaveLikeLinkToken } from '../behavior/LinkToken'
import * as h from '../helpers'

const v4_EXTRA_PUBLIC_ABI: string[] = []

h.describes().HH(`LinkToken ${Versions.v0_4}`, () => {
  const overrides: Record<string, string> = { Token677: 'LinkToken' }
  const _getContractFactory = (name: string, signer?: Signer) =>
    getContractFactory(overrides[name] || name, signer, Versions.v0_4)

  shouldBehaveLikeLinkToken(_getContractFactory, h.revertShim(Versions.v0_4), v4_EXTRA_PUBLIC_ABI)
})

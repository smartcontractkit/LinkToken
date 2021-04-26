import { Contract, ContractFactory, Signer } from 'ethers'
import { getContractFactory, Targets, Versions } from '../../../../src'

import { shouldBehaveLikeERC677Token } from '../../../behavior/ERC677Token'
import { shouldBehaveLikeLinkToken } from '../../../behavior/LinkToken'
import * as h from '../../../helpers'

export class LinkTokenChildTest__factory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  static new(signer?: Signer): ContractFactory {
    return (new LinkTokenChildTest__factory(signer) as unknown) as ContractFactory
  }

  deploy(...args: Array<any>): Promise<Contract> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      // Deploy LinkTokenChild contract
      const token = await getContractFactory(
        'LinkTokenChild',
        this.signer,
        Versions.v0_7,
        Targets.EVM,
      ).deploy()

      // Grant BRIDGE_GATEWAY_ROLE role
      const signerAddr = await this.signer.getAddress()
      const gatewayRole = await token.BRIDGE_GATEWAY_ROLE()
      await token.grantRole(gatewayRole, signerAddr)

      // Deposit requested amount
      await token.deposit(signerAddr, initBalance)
      return token
    }

    return _deploy()
  }

  connect(signer: Signer): ContractFactory {
    return LinkTokenChildTest__factory.new(signer)
  }
}

const OZ_AccessControl_PUBLIC_ABI = ['BRIDGE_GATEWAY_ROLE', 'deposit', 'withdraw']
const LinkTokenChild_PUBLIC_ABI = [
  'DEFAULT_ADMIN_ROLE',
  'hasRole',
  'getRoleMemberCount',
  'getRoleMember',
  'getRoleAdmin',
  'grantRole',
  'revokeRole',
  'renounceRole',
]
const EXTRA_PUBLIC_ABI = [
  'decreaseAllowance',
  'increaseAllowance',
  ...OZ_AccessControl_PUBLIC_ABI,
  ...LinkTokenChild_PUBLIC_ABI,
]

h.describes.HH(`LinkTokenChild ${Versions.v0_7}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) => {
    if (name === 'LinkToken' || name === 'Token677') {
      return LinkTokenChildTest__factory.new(signer)
    }
    return getContractFactory(name, signer, Versions.v0_6)
  }

  shouldBehaveLikeERC677Token(_getContractFactory, h.revertShim())
  shouldBehaveLikeLinkToken(_getContractFactory, h.revertShim(), EXTRA_PUBLIC_ABI)

  // TODO: LinkTokenChild specific tests
})

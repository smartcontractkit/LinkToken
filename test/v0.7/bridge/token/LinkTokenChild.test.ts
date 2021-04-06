import { ethers } from 'hardhat'
import { expect } from 'chai'
import { BigNumberish } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Contract, ContractFactory, Signer } from 'ethers'
import { getContractFactory, deploy, Targets, Versions, optimism } from '../../../../src'

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

describe(`LinkTokenChild ${Versions.v0_7}`, () => {
  h.describes.HH(`@unit ${Versions.v0_7}`, () => {
    const _getContractFactory = (name: string, signer?: Signer) => {
      if (name === 'LinkToken' || name === 'Token677') {
        return LinkTokenChildTest__factory.new(signer)
      }
      return getContractFactory(name, signer, Versions.v0_6)
    }

    shouldBehaveLikeERC677Token(_getContractFactory, h.revertShim())
    shouldBehaveLikeLinkToken(_getContractFactory, h.revertShim(), EXTRA_PUBLIC_ABI)

    describe(`Child token functionality`, () => {
      let l2Token: Contract

      beforeEach(async function () {
        const [admin] = await ethers.getSigners()
        // Deploy LinkTokenChild contract
        l2Token = await deploy(
          getContractFactory('LinkTokenChild', admin, Versions.v0_7, Targets.EVM),
          'LinkTokenChild',
        )
      })

      it('can NOT deposit without BRIDGE_GATEWAY_ROLE', async () => {
        const [_admin, recipient] = await ethers.getSigners()

        await expect(l2Token.connect(recipient).deposit(recipient.address, 100)).to.be.revertedWith(
          'LinkTokenChild: missing role',
        )
      })

      it('can deposit with BRIDGE_GATEWAY_ROLE', async () => {
        const [_admin, gateway, recipient] = await ethers.getSigners()

        // Get the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()

        const grantRoleTx = await l2Token.grantRole(
          gatewayRole,
          gateway.address,
          optimism.TX_OVERRIDES_OE_BUG,
        )
        await grantRoleTx.wait()

        // Admin deposit still fails
        await expect(l2Token.deposit(recipient.address, 100)).to.be.revertedWith(
          'LinkTokenChild: missing role',
        )

        await l2Token.connect(gateway).deposit(recipient.address, 100)

        const balance = await l2Token.balanceOf(recipient.address)
        expect(balance).to.be.equal(100)

        const totalSupply = await l2Token.totalSupply()
        expect(totalSupply).to.be.equal(100)
      })

      it('admin can give out multiple BRIDGE_GATEWAY_ROLE', async () => {
        const [_, gateway1, gateway2, recipient] = await ethers.getSigners()

        // Get the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()

        await l2Token.grantRole(gatewayRole, gateway1.address)
        await l2Token.grantRole(gatewayRole, gateway2.address)

        await l2Token.connect(gateway1).deposit(recipient.address, 100)
        await l2Token.connect(gateway2).deposit(recipient.address, 100)

        const balance = await l2Token.balanceOf(recipient.address)
        expect(balance).to.be.equal(200)

        const totalSupply = await l2Token.totalSupply()
        expect(totalSupply).to.be.equal(200)
      })
    })
  })

  h.describes.OE('@integration', () => {
    let oe: optimism.env.OptimismEnv, l2Token: Contract

    before(async function () {
      this.timeout(10000)

      // Load the configuration from environment
      oe = await optimism.loadEnv()
      // Fund L2 wallet
      await oe.depositL2(parseEther('10') as BigNumberish)

      // Deploy LinkTokenChild contract
      l2Token = await deploy(
        getContractFactory('LinkTokenChild', oe.l2Wallet, Versions.v0_7, Targets.OVM),
        'LinkTokenChild',
        [optimism.TX_OVERRIDES_OE_BUG],
      )
    })

    it('totalSupply is 0 on deploy', async () => {
      const totalSupply = await l2Token.totalSupply()
      expect(totalSupply).to.equal('0')
    })

    it('can NOT deposit without BRIDGE_GATEWAY_ROLE', async () => {
      const depositTx = await l2Token.deposit(
        oe.l2Wallet.address,
        100,
        optimism.TX_OVERRIDES_OE_BUG,
      )
      // TODO: fetch revert reason
      // revert: LinkTokenChild: missing role
      await h.txRevert(depositTx.wait())
    })
  })
})

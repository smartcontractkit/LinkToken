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
  'typeAndVersion',
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

    // TODO: refactor as a behavior that we can test both on Hardhat and Optimism networks
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
        // Deposit fails without the BRIDGE_GATEWAY_ROLE
        const depositTx = l2Token.connect(recipient).deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('LinkTokenChild: missing role')
      })

      it('only admin can grant BRIDGE_GATEWAY_ROLE', async () => {
        const [admin, fakeAdmin, gateway] = await ethers.getSigners()
        // Get the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        // Fake admin fails
        const grantRoleTx = l2Token.connect(fakeAdmin).grantRole(gatewayRole, gateway.address)
        await expect(grantRoleTx).to.be.revertedWith(
          'AccessControl: sender must be an admin to grant',
        )
        // Admin succeeds
        await l2Token.connect(admin).grantRole(gatewayRole, gateway.address)
      })

      it('can deposit with BRIDGE_GATEWAY_ROLE', async () => {
        const [_admin, gateway, recipient] = await ethers.getSigners()
        // Grant the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        await l2Token.grantRole(gatewayRole, gateway.address)
        // Admin deposit still fails
        const depositTx = l2Token.deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('LinkTokenChild: missing role')
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(100)
        expect(await l2Token.totalSupply()).to.be.equal(100)
      })

      it('admin can give out multiple BRIDGE_GATEWAY_ROLE', async () => {
        const [_, gateway1, gateway2, recipient] = await ethers.getSigners()
        // Grant the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        await l2Token.grantRole(gatewayRole, gateway1.address)
        await l2Token.grantRole(gatewayRole, gateway2.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway1).deposit(recipient.address, 100)
        await l2Token.connect(gateway2).deposit(recipient.address, 100)
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(200)
        expect(await l2Token.totalSupply()).to.be.equal(200)
      })

      it('admin can give out and revoke BRIDGE_GATEWAY_ROLE', async () => {
        const [_, gateway, recipient] = await ethers.getSigners()
        // Grant the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        await l2Token.grantRole(gatewayRole, gateway.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Revoke gateway role
        await l2Token.revokeRole(gatewayRole, gateway.address)
        // Deposits now fail
        const depositTx = l2Token.connect(gateway).deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('LinkTokenChild: missing role')
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(100)
        expect(await l2Token.totalSupply()).to.be.equal(100)
      })

      it('only gateway can withdraw', async () => {
        const [_, gateway, recipient] = await ethers.getSigners()
        // Grant the required gateway role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        await l2Token.grantRole(gatewayRole, gateway.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Recipients direct withdraw fails
        const withdrawTx1 = l2Token.connect(recipient).withdraw(69)
        await expect(withdrawTx1).to.be.revertedWith('LinkTokenChild: missing role')
        // Gateway can withdraw on behalf of the user
        await l2Token.connect(recipient).transfer(gateway.address, 69)
        await l2Token.connect(gateway).withdraw(69)
        // Gateway can NOT withdraw more
        const withdrawTx3 = l2Token.connect(gateway).withdraw(10)
        await expect(withdrawTx3).to.be.revertedWith('ERC20: burn amount exceeds balance')
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(31)
        expect(await l2Token.totalSupply()).to.be.equal(31)
      })

      it('admin can renounce DEFAULT_ADMIN_ROLE', async () => {
        const [admin, gateway] = await ethers.getSigners()
        // Renounce the admin role
        const adminRole = await l2Token.DEFAULT_ADMIN_ROLE()
        await l2Token.renounceRole(adminRole, admin.address)
        // Reverts on grantRole
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        const grantRoleTx = l2Token.grantRole(gatewayRole, gateway.address)
        await expect(grantRoleTx).to.be.revertedWith(
          'AccessControl: sender must be an admin to grant',
        )
      })
    })
  })

  h.describes.OE('@integration', () => {
    let oe: optimism.env.OptimismEnv, l2Token: Contract

    before(async function () {
      this.timeout(10000)

      // Load the configuration from environment
      oe = await h.optimism.loadEnv()
      // Fund L2 wallet
      await oe.depositL2(parseEther('10') as BigNumberish)

      // Deploy LinkTokenChild contract
      l2Token = await deploy(
        getContractFactory('LinkTokenChild', oe.l2Wallet, Versions.v0_7, Targets.OVM),
        'LinkTokenChild',
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
        h.optimism.TX_OVERRIDES_OE_BUG,
      )
      // TODO: fetch revert reason
      // revert: LinkTokenChild: missing role
      await h.txRevert(depositTx.wait())
    })

    it('admin can migrate to a new gateway', async () => {
      const admin = oe.l2Wallet
      const gateway = oe.l2Wallet // TODO: generate acc
      // Grant the required gateway role
      const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
      const grantRoleTx1 = await l2Token.grantRole(gatewayRole, admin.address)
      await grantRoleTx1.wait()
      // Deposit some tokens as admin/gateway
      const depositTx1 = await l2Token.deposit(admin.address, 100, h.optimism.TX_OVERRIDES_OE_BUG)
      await depositTx1.wait()
      // Assert state
      expect(await l2Token.balanceOf(admin.address)).to.be.equal(100)
      expect(await l2Token.totalSupply()).to.be.equal(100)
      // Admin can withdraw directly as it has a gateway role
      const withdrawTx = await l2Token.withdraw(100)
      await withdrawTx.wait()
      // Assert state
      expect(await l2Token.balanceOf(admin.address)).to.be.equal(0)
      expect(await l2Token.totalSupply()).to.be.equal(0)
      // Grant role to a new gateway
      const grantRoleTx2 = await l2Token.grantRole(gatewayRole, gateway.address)
      await grantRoleTx2.wait()
      // Revoke gateway role from admin
      const revokeRoleTx = await l2Token.revokeRole(gatewayRole, admin.address)
      await revokeRoleTx.wait()
      // Admin deposit fails
      const depositTx = await l2Token.deposit(admin.address, 100, h.optimism.TX_OVERRIDES_OE_BUG)
      // TODO: fetch revert reason
      // revert: LinkTokenChild: missing role
      await h.txRevert(depositTx.wait())
      // Renounce the admin role
      const adminRole = await l2Token.DEFAULT_ADMIN_ROLE()
      const renounceRoleTx = await l2Token.renounceRole(adminRole, admin.address)
      await renounceRoleTx.wait()
    })
  })
})

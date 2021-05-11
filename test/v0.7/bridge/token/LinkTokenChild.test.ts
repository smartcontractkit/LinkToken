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
      const token = await getContractFactory('LinkTokenChild', this.signer, Versions.v0_7, Targets.EVM).deploy()

      // Grant access (gateway role)
      const signerAddr = await this.signer.getAddress()
      await token.addAccess(signerAddr)

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

const SimpleWriteAccessController_PUBLIC_ABI = [
  'owner',
  'transferOwnership',
  'acceptOwnership',
  'checkEnabled',
  'hasAccess',
  'addAccess',
  'removeAccess',
  'enableAccessCheck',
  'disableAccessCheck',
]
const LinkTokenChild_PUBLIC_ABI = ['deposit', 'withdraw']
const EXTRA_PUBLIC_ABI = [
  'decreaseAllowance',
  'increaseAllowance',
  'typeAndVersion',
  ...SimpleWriteAccessController_PUBLIC_ABI,
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
        const [owner] = await ethers.getSigners()
        // Deploy LinkTokenChild contract
        l2Token = await deploy(
          getContractFactory('LinkTokenChild', owner, Versions.v0_7, Targets.EVM),
          'LinkTokenChild',
        )
      })

      it('can NOT deposit without access (gateway role)', async () => {
        const [_owner, recipient] = await ethers.getSigners()
        // Deposit fails without access (gateway role)
        const depositTx = l2Token.connect(recipient).deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('No access')
      })

      it('only owner can grant access (gateway role)', async () => {
        const [owner, fakeOwner, gateway] = await ethers.getSigners()
        // Fake owner fails
        const addAccessTx = l2Token.connect(fakeOwner).addAccess(gateway.address)
        await expect(addAccessTx).to.be.revertedWith('Only callable by owner')
        // Owner succeeds
        await l2Token.connect(owner).addAccess(gateway.address)
      })

      it('can deposit with access (gateway role)', async () => {
        const [_owner, gateway, recipient] = await ethers.getSigners()
        await l2Token.addAccess(gateway.address)
        // Owner deposit still fails
        const depositTx = l2Token.deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('No access')
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(100)
        expect(await l2Token.totalSupply()).to.be.equal(100)
      })

      it('owner can give out multiple access (gateway role)', async () => {
        const [_, gateway1, gateway2, recipient] = await ethers.getSigners()
        await l2Token.addAccess(gateway1.address)
        await l2Token.addAccess(gateway2.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway1).deposit(recipient.address, 100)
        await l2Token.connect(gateway2).deposit(recipient.address, 100)
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(200)
        expect(await l2Token.totalSupply()).to.be.equal(200)
      })

      it('owner can give out and revoke access (gateway role)', async () => {
        const [_, gateway, recipient] = await ethers.getSigners()
        await l2Token.addAccess(gateway.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Revoke gateway role
        await l2Token.removeAccess(gateway.address)
        // Deposits now fail
        const depositTx = l2Token.connect(gateway).deposit(recipient.address, 100)
        await expect(depositTx).to.be.revertedWith('No access')
        // Assert state
        expect(await l2Token.balanceOf(recipient.address)).to.be.equal(100)
        expect(await l2Token.totalSupply()).to.be.equal(100)
      })

      it('only gateway can withdraw', async () => {
        const [_, gateway, recipient] = await ethers.getSigners()
        await l2Token.addAccess(gateway.address)
        // Gateway deposit succeeds
        await l2Token.connect(gateway).deposit(recipient.address, 100)
        // Recipients direct withdraw fails
        const withdrawTx1 = l2Token.connect(recipient).withdraw(69)
        await expect(withdrawTx1).to.be.revertedWith('No access')
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

    it('can NOT deposit without access (gateway role)', async () => {
      const depositTx = await l2Token.deposit(oe.l2Wallet.address, 100, h.optimism.TX_OVERRIDES_OE_BUG)
      // TODO: fetch revert reason
      // revert: 'No access'
      await h.txRevert(depositTx.wait())
    })

    it('owner can migrate to a new gateway', async () => {
      const owner = oe.l2Wallet
      const gateway = oe.l2Wallet // TODO: generate acc
      // Grant the required gateway role
      const addAccessTx1 = await l2Token.addAccess(owner.address)
      await addAccessTx1.wait()
      // Deposit some tokens as owner/gateway
      const depositTx1 = await l2Token.deposit(owner.address, 100)
      await depositTx1.wait()
      // Assert state
      expect(await l2Token.balanceOf(owner.address)).to.be.equal(100)
      expect(await l2Token.totalSupply()).to.be.equal(100)
      // Owner can withdraw directly as it has a gateway role
      const withdrawTx = await l2Token.withdraw(100)
      await withdrawTx.wait()
      // Assert state
      expect(await l2Token.balanceOf(owner.address)).to.be.equal(0)
      expect(await l2Token.totalSupply()).to.be.equal(0)
      // Grant role to a new gateway
      const addAccessTx2 = await l2Token.addAccess(gateway.address)
      await addAccessTx2.wait()
      // Revoke gateway role from owner
      const removeAccessTx = await l2Token.removeAccess(owner.address)
      await removeAccessTx.wait()
      // Owner deposit fails
      const depositTx = await l2Token.deposit(owner.address, 100, h.optimism.TX_OVERRIDES_OE_BUG)
      // TODO: fetch revert reason
      // revert: 'No access'
      await h.txRevert(depositTx.wait())
    })
  })
})

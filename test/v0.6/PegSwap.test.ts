import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { PegSwap__factory } from '../../build/types/v0.6/factories/PegSwap__factory'
import { Token677__factory } from '../../build/types/v0.6/factories/Token677__factory'
import { StandardTokenMock__factory } from '../../build/types/v0.6/factories/StandardTokenMock__factory'

import * as h from '../helpers'

h.describes.HH('ERC677Token', () => {
  let swap: Contract,
    owner: SignerWithAddress,
    base: Contract,
    wrapped: Contract,
    user: SignerWithAddress

  const totalIssuance = 1000
  const depositAmount = 100
  const tradeAmount = 10
  const ownerBaseAmount = totalIssuance - depositAmount

  before(async () => {
    ;[owner, user] = await ethers.getSigners()
  })

  beforeEach(async () => {
    base = await new StandardTokenMock__factory(owner).deploy(owner.address, totalIssuance)
    wrapped = await new Token677__factory(owner).deploy(totalIssuance)
    swap = await new PegSwap__factory(owner).deploy()

    await base.connect(owner).transfer(user.address, depositAmount)
  })

  it('has a limited public ABI', () => {
    h.publicAbi(swap, [
      'typeAndVersion',
      'addLiquidity',
      'getSwappableAmount',
      'onTokenTransfer',
      'recoverStuckTokens',
      'removeLiquidity',
      'swap',
      // Owned functions
      'acceptOwnership',
      'owner',
      'transferOwnership',
    ])
  })

  describe('#addLiquidity(address,address)', () => {
    beforeEach(async () => {
      await wrapped.connect(owner).approve(swap.address, depositAmount)
    })

    it("withdraws the amount from the owner's balance on the target token", async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance).to.equal(0)
      let ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance).to.equal(totalIssuance)

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance).to.equal(depositAmount)
      ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance).to.equal(totalIssuance - depositAmount)
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).to.equal(0)
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance).to.equal(ownerBaseAmount)

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      expect(await base.balanceOf(swap.address)).to.equal(swapBalance)
      expect(await base.balanceOf(owner.address)).to.equal(ownerBalance)
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(0)

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(depositAmount)
    })

    describe('before the owner has added liquidity to a pair', () => {
      it('reverts addLiquidity base -> wrapped', async () => {
        await expect(
          swap.connect(user).addLiquidity(0, base.address, wrapped.address),
        ).to.be.revertedWith('VM Exception while processing transaction:')
      })

      it('reverts addLiquidity wrapped -> base', async () => {
        await expect(
          swap.connect(user).addLiquidity(0, wrapped.address, base.address),
        ).to.be.revertedWith('VM Exception while processing transaction:')
      })
    })

    describe('after the owner has added liquidity to a pair', () => {
      beforeEach(async () => {
        await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)
      })

      it('can be called by anyone in either direction', async () => {
        await swap.connect(user).addLiquidity(0, base.address, wrapped.address) // doesn't revert

        await swap.connect(user).addLiquidity(0, wrapped.address, base.address) // doesn't revert
      })
    })
  })

  describe('#removeLiquidity(uint256,address,address)', () => {
    const depositAmount = 100
    const withdrawalAmount = 50
    const startingAmount = totalIssuance - depositAmount

    beforeEach(async () => {
      await wrapped.connect(owner).approve(swap.address, depositAmount)
      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)
    })

    it('reverts if called by anyone other than the owner', async () => {
      await expect(
        swap.connect(user).removeLiquidity(withdrawalAmount, base.address, wrapped.address),
      ).to.be.revertedWith('VM Exception while processing transaction:')
    })

    it("withdraws the amount from the swap's balance on the target to the owner", async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance).to.equal(depositAmount)
      let ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance).to.equal(startingAmount)

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance).to.equal(depositAmount - withdrawalAmount)
      ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance).to.equal(startingAmount + withdrawalAmount)
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).to.equal(0)
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance).to.equal(ownerBaseAmount)

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      expect(await base.balanceOf(swap.address)).to.equal(swapBalance)
      expect(await base.balanceOf(owner.address)).to.equal(ownerBalance)
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(depositAmount)

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(depositAmount - withdrawalAmount)
    })
  })

  describe('swap(uint256,address,address)', () => {
    beforeEach(async () => {
      await wrapped.connect(owner).approve(swap.address, depositAmount)
      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)
    })

    it('reverts if enough funds have not been approved before', async () => {
      await expect(
        swap.connect(user).swap(tradeAmount, base.address, wrapped.address),
      ).to.be.revertedWith('VM Exception while processing transaction:')
    })

    describe('after the user has approved the contract', () => {
      beforeEach(async () => {
        await base.connect(user).approve(swap.address, depositAmount)
      })

      it('pulls source funds from the user', async () => {
        let swapBalance = await base.balanceOf(swap.address)
        expect(swapBalance).to.equal(0)
        let userBalance = await base.balanceOf(user.address)
        expect(userBalance).to.equal(depositAmount)

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swapBalance = await base.balanceOf(swap.address)
        expect(swapBalance).to.equal(tradeAmount)
        userBalance = await base.balanceOf(user.address)
        expect(userBalance).to.equal(depositAmount - tradeAmount)
      })

      it('sends target funds to the user', async () => {
        let swapBalance = await wrapped.balanceOf(swap.address)
        expect(swapBalance).to.equal(depositAmount)
        let userBalance = await wrapped.balanceOf(user.address)
        expect(userBalance).to.equal(0)

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swapBalance = await wrapped.balanceOf(swap.address)
        expect(swapBalance).to.equal(depositAmount - tradeAmount)
        userBalance = await wrapped.balanceOf(user.address)
        expect(userBalance).to.equal(tradeAmount)
      })

      it('updates the swappable amount for the pair', async () => {
        let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
        expect(swappable).to.equal(depositAmount)

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swappable = await swap.getSwappableAmount(base.address, wrapped.address)
        expect(swappable).to.equal(depositAmount - tradeAmount)
      })

      it('updates the swappable amount for the inverse of the pair', async () => {
        let swappable = await swap.getSwappableAmount(wrapped.address, base.address)
        expect(swappable).to.equal(0)

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swappable = await swap.getSwappableAmount(wrapped.address, base.address)
        expect(swappable).to.equal(tradeAmount)
      })

      describe('when there are not enough swappable funds available', () => {
        it('raises an error', async () => {
          const askAmount = depositAmount * 2
          await base.connect(owner).transfer(user.address, askAmount)
          await base.connect(user).approve(swap.address, askAmount)

          await expect(
            swap.connect(user).swap(askAmount, base.address, wrapped.address),
          ).to.be.revertedWith('VM Exception while processing transaction:')
        })
      })
    })
  })

  describe('recoverStuckTokens(uint256,address)', () => {
    const dumbAmount = 420

    beforeEach(async () => {
      await base.connect(owner).transfer(swap.address, dumbAmount)
    })

    it('reverts if enough funds have not been approved before', async () => {
      await expect(
        swap.connect(user).recoverStuckTokens(tradeAmount, base.address),
      ).to.be.revertedWith('VM Exception while processing transaction:')
    })

    it('moves deposits for any token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).to.equal(dumbAmount)
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance).to.equal(ownerBaseAmount - dumbAmount)

      await swap.connect(owner).recoverStuckTokens(dumbAmount, base.address)

      swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).to.equal(0)
      ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance).to.equal(ownerBaseAmount)
    })
  })

  describe('onTokenTransfer(address,uint256,bytes)', () => {
    beforeEach(async () => {
      await wrapped.connect(owner).transfer(user.address, depositAmount)
      await base.connect(owner).approve(swap.address, depositAmount)
      await swap.connect(owner).addLiquidity(depositAmount, wrapped.address, base.address)
    })

    it('pulls accepts the source funds from the user', async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      //assert.equal(depositAmount, swapBalance)
      expect(swapBalance).to.equal(0)
      let userBalance = await wrapped.balanceOf(user.address)
      expect(userBalance).to.equal(depositAmount)

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance).to.equal(tradeAmount)
      userBalance = await wrapped.balanceOf(user.address)
      expect(userBalance).to.equal(depositAmount - tradeAmount)
    })

    it('sends target funds to the user', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).of.equal(depositAmount)
      let userBalance = await base.balanceOf(user.address)
      expect(userBalance).to.equal(depositAmount)

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance).to.equal(depositAmount - tradeAmount)
      userBalance = await base.balanceOf(user.address)
      expect(userBalance).to.equal(depositAmount + tradeAmount)
    })

    it('updates the swappable amount for the inverse of the pair', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(0)

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable).to.equal(tradeAmount)
    })

    it('updates the swappable amount for the pair', async () => {
      let swappable = await swap.getSwappableAmount(wrapped.address, base.address)
      expect(swappable).to.equal(depositAmount)

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swappable = await swap.getSwappableAmount(wrapped.address, base.address)
      expect(swappable).to.equal(depositAmount - tradeAmount)
    })
  })
})

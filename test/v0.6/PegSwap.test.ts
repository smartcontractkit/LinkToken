import { Wallet, Contract } from 'ethers'
import { setup, matchers } from '@chainlink/test-helpers'
import * as h from '../helpers'

import { PegSwapFactory } from '../../build/ethers/v0.6/PegSwapFactory'
import { Token677Factory } from '../../build/ethers/v0.6/Token677Factory'
import { StandardTokenMockFactory } from '../../build/ethers/v0.6/StandardTokenMockFactory'

describe('ERC677Token', () => {
  let swap: Contract, owner: Wallet, base: Contract, wrapped: Contract, user: Wallet
  const totalIssuance = 1000
  const depositAmount = 100
  const tradeAmount = 10
  const ownerBaseAmount = totalIssuance - depositAmount

  const provider = setup.provider()

  beforeAll(async () => {
    const { personas } = await setup.users(provider)
    owner = personas.Carol
    user = personas.Ned
  })

  beforeEach(async () => {
    base = await new StandardTokenMockFactory(owner).deploy(owner.address, totalIssuance)
    wrapped = await new Token677Factory(owner).deploy(totalIssuance)
    swap = await new PegSwapFactory(owner).deploy()

    await base.connect(owner).transfer(user.address, depositAmount)
  })

  it('has a limited public ABI', () => {
    matchers.publicAbi(swap, [
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
      expect(swapBalance.eq(0)).toBeTruthy()
      let ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance.eq(totalIssuance)).toBeTruthy()

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance.eq(depositAmount)).toBeTruthy()
      ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance.eq(totalIssuance - depositAmount)).toBeTruthy()
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(0)).toBeTruthy()
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance.eq(ownerBaseAmount)).toBeTruthy()

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      expect(swapBalance.eq(await base.balanceOf(swap.address))).toBeTruthy()
      expect(ownerBalance.eq(await base.balanceOf(owner.address))).toBeTruthy()
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(0)).toBeTruthy()

      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(depositAmount)).toBeTruthy()
    })

    describe('before the owner has added liquidity to a pair', () => {
      it('reverts addLiquidity base -> wrapped', async () => {
        matchers.evmRevert(
          swap.connect(user).addLiquidity(0, base.address, wrapped.address),
          'VM Exception while processing transaction:',
        )
      })

      it('reverts addLiquidity wrapped -> base', async () => {
        matchers.evmRevert(
          swap.connect(user).addLiquidity(0, wrapped.address, base.address),
          'VM Exception while processing transaction:',
        )
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
      matchers.evmRevert(
        swap.connect(user).removeLiquidity(withdrawalAmount, base.address, wrapped.address),
        'VM Exception while processing transaction:',
      )
    })

    it("withdraws the amount from the swap's balance on the target to the owner", async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance.eq(depositAmount)).toBeTruthy()
      let ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance.eq(startingAmount)).toBeTruthy()

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance.eq(depositAmount - withdrawalAmount)).toBeTruthy()
      ownerBalance = await wrapped.balanceOf(owner.address)
      expect(ownerBalance.eq(startingAmount + withdrawalAmount)).toBeTruthy()
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(0)).toBeTruthy()
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance.eq(ownerBaseAmount)).toBeTruthy()

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      expect(swapBalance.eq(await base.balanceOf(swap.address))).toBeTruthy()
      expect(ownerBalance.eq(await base.balanceOf(owner.address))).toBeTruthy()
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(depositAmount)).toBeTruthy()

      await swap.connect(owner).removeLiquidity(withdrawalAmount, base.address, wrapped.address)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(depositAmount - withdrawalAmount)).toBeTruthy()
    })
  })

  describe('swap(uint256,address,address)', () => {
    beforeEach(async () => {
      await wrapped.connect(owner).approve(swap.address, depositAmount)
      await swap.connect(owner).addLiquidity(depositAmount, base.address, wrapped.address)
    })

    it('reverts if enough funds have not been approved before', async () => {
      matchers.evmRevert(
        swap.connect(user).swap(tradeAmount, base.address, wrapped.address),
        'VM Exception while processing transaction:',
      )
    })

    describe('after the user has approved the contract', () => {
      beforeEach(async () => {
        await base.connect(user).approve(swap.address, depositAmount)
      })

      it('pulls source funds from the user', async () => {
        let swapBalance = await base.balanceOf(swap.address)
        expect(swapBalance.eq(0)).toBeTruthy()
        let userBalance = await base.balanceOf(user.address)
        expect(userBalance.eq(depositAmount)).toBeTruthy()

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swapBalance = await base.balanceOf(swap.address)
        expect(swapBalance.eq(tradeAmount)).toBeTruthy()
        userBalance = await base.balanceOf(user.address)
        expect(userBalance.eq(depositAmount - tradeAmount)).toBeTruthy()
      })

      it('sends target funds to the user', async () => {
        let swapBalance = await wrapped.balanceOf(swap.address)
        expect(swapBalance.eq(depositAmount)).toBeTruthy()
        let userBalance = await wrapped.balanceOf(user.address)
        expect(userBalance.eq(0)).toBeTruthy()

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swapBalance = await wrapped.balanceOf(swap.address)
        expect(swapBalance.eq(depositAmount - tradeAmount)).toBeTruthy()
        userBalance = await wrapped.balanceOf(user.address)
        expect(userBalance.eq(tradeAmount)).toBeTruthy()
      })

      it('updates the swappable amount for the pair', async () => {
        let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
        expect(swappable.eq(depositAmount)).toBeTruthy()

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swappable = await swap.getSwappableAmount(base.address, wrapped.address)
        expect(swappable.eq(depositAmount - tradeAmount)).toBeTruthy()
      })

      it('updates the swappable amount for the inverse of the pair', async () => {
        let swappable = await swap.getSwappableAmount(wrapped.address, base.address)
        expect(swappable.eq(0)).toBeTruthy()

        await swap.connect(user).swap(tradeAmount, base.address, wrapped.address)

        swappable = await swap.getSwappableAmount(wrapped.address, base.address)
        expect(swappable.eq(tradeAmount)).toBeTruthy()
      })

      describe('when there are not enough swappable funds available', () => {
        it('raises an error', async () => {
          const askAmount = depositAmount * 2
          await base.connect(owner).transfer(user.address, askAmount)
          await base.connect(user).approve(swap.address, askAmount)

          matchers.evmRevert(
            swap.connect(user).swap(askAmount, base.address, wrapped.address),
            'VM Exception while processing transaction:',
          )
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
      matchers.evmRevert(
        swap.connect(user).recoverStuckTokens(tradeAmount, base.address),
        'VM Exception while processing transaction:',
      )
    })

    it('moves deposits for any token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(dumbAmount)).toBeTruthy()
      let ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance.eq(ownerBaseAmount - dumbAmount)).toBeTruthy()

      await swap.connect(owner).recoverStuckTokens(dumbAmount, base.address)

      swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(0)).toBeTruthy()
      ownerBalance = await base.balanceOf(owner.address)
      expect(ownerBalance.eq(ownerBaseAmount)).toBeTruthy()
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
      expect(swapBalance.eq(0)).toBeTruthy()
      let userBalance = await wrapped.balanceOf(user.address)
      expect(userBalance.eq(depositAmount)).toBeTruthy()

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swapBalance = await wrapped.balanceOf(swap.address)
      expect(swapBalance.eq(tradeAmount)).toBeTruthy()
      userBalance = await wrapped.balanceOf(user.address)
      expect(userBalance.eq(depositAmount - tradeAmount)).toBeTruthy()
    })

    it('sends target funds to the user', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(depositAmount)).toBeTruthy()
      let userBalance = await base.balanceOf(user.address)
      expect(userBalance.eq(depositAmount)).toBeTruthy()

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swapBalance = await base.balanceOf(swap.address)
      expect(swapBalance.eq(depositAmount - tradeAmount)).toBeTruthy()
      userBalance = await base.balanceOf(user.address)
      expect(userBalance.eq(depositAmount + tradeAmount)).toBeTruthy()
    })

    it('updates the swappable amount for the inverse of the pair', async () => {
      let swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(0)).toBeTruthy()

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swappable = await swap.getSwappableAmount(base.address, wrapped.address)
      expect(swappable.eq(tradeAmount)).toBeTruthy()
    })

    it('updates the swappable amount for the pair', async () => {
      let swappable = await swap.getSwappableAmount(wrapped.address, base.address)
      expect(swappable.eq(depositAmount)).toBeTruthy()

      const data = '0x' + h.encodeAddress(base.address)
      await wrapped.connect(user).transferAndCall(swap.address, tradeAmount, data)

      swappable = await swap.getSwappableAmount(wrapped.address, base.address)
      expect(swappable.eq(depositAmount - tradeAmount)).toBeTruthy()
    })
  })
})

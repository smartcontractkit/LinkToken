require('../support/helpers.js')

contract('SimpleSwap', accounts => {
  let { SimpleSwap } = require('../../build/truffle/v0.6/SimpleSwap')
  let { Token677 } = require('../../build/truffle/v0.6/Token677')
  let { StandardTokenMock } = require('../../build/truffle/v0.6/StandardTokenMock')
  const Token20 = StandardTokenMock

  let swap, owner, base, wrapped, user
  const totalIssuance = 1000

  beforeEach(async () => {
    owner = accounts[0]
    user = accounts[1]
    base = await Token677.new(totalIssuance, { from: owner })
    wrapped = await Token20.new(owner, totalIssuance, { from: owner })
    swap = await SimpleSwap.new({ from: owner })
  })

  describe('#addLiquidity(address,address)', () => {
    const depositAmount = 100

    beforeEach(async () => {
      await wrapped.approve(swap.address, depositAmount, { from: owner })
    })

    it('reverts if called by anyone other than the owner', async () => {
      await swap.addLiquidity(base.address, wrapped.address, { from: user }) // doesn't revert
    })

    it("withdraws the amount from the owner's balance on the target token", async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      assert.equal(0, swapBalance)
      let ownerBalance = await wrapped.balanceOf(owner)
      assert.equal(totalIssuance, ownerBalance)

      await swap.addLiquidity(base.address, wrapped.address, { from: owner })

      swapBalance = await wrapped.balanceOf(swap.address)
      assert.equal(depositAmount, swapBalance)
      ownerBalance = await wrapped.balanceOf(owner)
      assert.equal(totalIssuance - depositAmount, ownerBalance)
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      assert.equal(0, swapBalance)
      let ownerBalance = await base.balanceOf(owner)
      assert.equal(totalIssuance, ownerBalance)

      await swap.addLiquidity(base.address, wrapped.address, { from: owner })

      assert.equal(swapBalance.toString(), (await base.balanceOf(swap.address)).toString())
      assert.equal(ownerBalance.toString(), (await base.balanceOf(owner)).toString())
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.swappable.call(base.address, wrapped.address)
      assert.equal(0, swappable)

      await swap.addLiquidity(base.address, wrapped.address, { from: owner })

      swappable = await swap.swappable.call(base.address, wrapped.address)
      assert.equal(depositAmount, swappable)
    })
  })

  describe('#removeLiquidity(uint256,address,address)', () => {
    const depositAmount = 100
    const withdrawalAmount = 50
    const startingAmount = totalIssuance - depositAmount

    beforeEach(async () => {
      await wrapped.approve(swap.address, depositAmount, { from: owner })
      await swap.addLiquidity(base.address, wrapped.address, { from: owner })
    })

    it('reverts if called by anyone other than the owner', async () => {
      await assertActionThrows(async () => {
        await swap.removeLiquidity(withdrawalAmount, base.address, wrapped.address, {
          from: user,
        })
      })
    })

    it("withdraws the amount from the swap's balance on the target to the owner", async () => {
      let swapBalance = await wrapped.balanceOf(swap.address)
      assert.equal(depositAmount, swapBalance)
      let ownerBalance = await wrapped.balanceOf(owner)
      assert.equal(totalIssuance - depositAmount, ownerBalance)

      await swap.removeLiquidity(withdrawalAmount, base.address, wrapped.address, {
        from: owner,
      })

      swapBalance = await wrapped.balanceOf(swap.address)
      assert.equal(depositAmount - withdrawalAmount, swapBalance)
      ownerBalance = await wrapped.balanceOf(owner)
      assert.equal((startingAmount + withdrawalAmount).toString(), ownerBalance.toString())
    })

    it('does not change balance amounts on source token', async () => {
      let swapBalance = await base.balanceOf(swap.address)
      assert.equal(0, swapBalance)
      let ownerBalance = await base.balanceOf(owner)
      assert.equal(totalIssuance.toString(), ownerBalance.toString())

      await swap.removeLiquidity(withdrawalAmount, base.address, wrapped.address, {
        from: owner,
      })

      assert.equal(swapBalance.toString(), (await base.balanceOf(swap.address)).toString())
      assert.equal(ownerBalance.toString(), (await base.balanceOf(owner)).toString())
    })

    it('updates the swappable amount', async () => {
      let swappable = await swap.swappable.call(base.address, wrapped.address)
      assert.equal(depositAmount, swappable)

      await swap.removeLiquidity(withdrawalAmount, base.address, wrapped.address, {
        from: owner,
      })

      swappable = await swap.swappable.call(base.address, wrapped.address)
      assert.equal(depositAmount - withdrawalAmount, swappable)
    })
  })
})

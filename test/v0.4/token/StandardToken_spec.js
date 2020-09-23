'use strict'

require('../../support/zeppelinHelpers.js')

contract('StandardToken', function(accounts) {
  var { StandardTokenMock } = require('../../../build/truffle/v0.4/StandardTokenMock')
  const options = { from: accounts[0] }
  let token

  beforeEach(async function() {
    token = await StandardTokenMock.new(accounts[0], 100, options)
  })

  it('should return the correct totalSupply after construction', async function() {
    let totalSupply = await token.totalSupply()

    assert.equal(totalSupply, 100)
  })

  it('should return the correct allowance amount after approval', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100, options)
    await token.approve(accounts[1], 100, options)
    let allowance = await token.allowance(accounts[0], accounts[1])

    assert.equal(allowance, 100)
  })

  it('should return correct balances after transfer', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100, options)
    await token.transfer(accounts[1], 100, options)
    let balance0 = await token.balanceOf(accounts[0])
    assert.equal(balance0, 0)

    let balance1 = await token.balanceOf(accounts[1])
    assert.equal(balance1, 100)
  })

  it('should throw an error when trying to transfer more than balance', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100, options)
    try {
      await token.transfer(accounts[1], 101, options)
      assert.fail('should have thrown before')
    } catch (error) {
      assertJump(error)
    }
  })

  it('should return correct balances after transfering from another account', async function() {
    let token = await StandardTokenMock.new(accounts[0], 100, options)
    await token.approve(accounts[1], 100, options)
    await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] })

    let balance0 = await token.balanceOf(accounts[0])
    assert.equal(balance0, 0)

    let balance1 = await token.balanceOf(accounts[2])
    assert.equal(balance1, 100)

    let balance2 = await token.balanceOf(accounts[1])
    assert.equal(balance2, 0)
  })

  it('should throw an error when trying to transfer more than allowed', async function() {
    await token.approve(accounts[1], 99, options)
    try {
      await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] })
      assert.fail('should have thrown before')
    } catch (error) {
      assertJump(error)
    }
  })

  describe('validating allowance updates to spender', function() {
    let preApproved

    it('should start with zero', async function() {
      preApproved = bigNum(await token.allowance(accounts[0], accounts[1]))
      assert.equal(preApproved, 0)
    })

    it('should increase by 50 then decrease by 10', async function() {
      await token.increaseApproval(accounts[1], 50, options)
      let postIncrease = bigNum(await token.allowance(accounts[0], accounts[1]))
      assert.equal(preApproved.plus(50).toString(), postIncrease.toString())
      await token.decreaseApproval(accounts[1], 10, options)
      let postDecrease = await token.allowance(accounts[0], accounts[1])
      assert.equal(postIncrease.minus(10).toString(), postDecrease.toString())
    })
  })
})

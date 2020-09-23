'use strict'

require('../../support/zeppelinHelpers.js')

contract('BasicToken', function(accounts) {
  var { BasicTokenMock } = require('../../../build/truffle/v0.4/BasicTokenMock')
  BasicTokenMock.setProvider(web3.currentProvider)

  const options = { from: accounts[0] }

  it('should return the correct totalSupply after construction', async function() {
    let token = await BasicTokenMock.new(accounts[0], 100, options)
    let totalSupply = await token.totalSupply()

    assert.equal(totalSupply, 100)
  })

  it('should return correct balances after transfer', async function() {
    let token = await BasicTokenMock.new(accounts[0], 100, options)
    let transfer = await token.transfer(accounts[1], 100, options)

    let firstAccountBalance = await token.balanceOf(accounts[0])
    assert.equal(firstAccountBalance, 0)

    let secondAccountBalance = await token.balanceOf(accounts[1])
    assert.equal(secondAccountBalance, 100)
  })

  it('should throw an error when trying to transfer more than balance', async function() {
    let token = await BasicTokenMock.new(accounts[0], 100, options)
    try {
      let transfer = await token.transfer(accounts[1], 101, options)
      assert.fail('should have thrown before')
    } catch (error) {
      assertJump(error)
    }
  })
})

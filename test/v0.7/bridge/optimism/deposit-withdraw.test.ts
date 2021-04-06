import { BigNumberish } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { expect } from 'chai'
import { depositAndWithdraw, CheckBalances } from '../../../../scripts/deposit-withdraw'
import { optimism } from '../../../../src'
import * as h from '../../../helpers'

h.describes().OE('Optimism deposit-withdraw @integration', () => {
  let oe: optimism.env.OptimismEnv

  before(async function () {
    this.timeout(10000)

    // Load the configuration from environment
    oe = await h.optimism.loadEnv()
    // Fund L2 wallet
    await oe.depositL2(parseEther('1') as BigNumberish)
  })

  const checkBalances = (step = 0): CheckBalances => async (
    l1Wallet,
    l1ERC20,
    l2Wallet,
    l2ERC20,
  ) => {
    const _expect = async (_l1Balance: string, _l2Balance: string) => {
      const l1Balance = await l1ERC20.balanceOf(l1Wallet.address)
      expect(l1Balance).to.equal(_l1Balance)

      const l2Balance = await l2ERC20.balanceOf(l2Wallet.address)
      expect(l2Balance).to.equal(_l2Balance)
    }

    switch (step++) {
      case 0:
        return await _expect('1000000000000000000000000000', '0')
      case 1:
        return await _expect('999999999999999999999999999', '1')
      case 2:
        return await _expect('1000000000000000000000000000', '0')
      default:
        expect(step).to.be.lte(3)
    }
  }

  describe('deposit L1->L2, withdraw L2->L1', () => {
    it('approve/transferFrom ', async () => {
      await depositAndWithdraw(oe, checkBalances())
    }).timeout(60000)

    it('transferAndCall', async () => {
      const amount = 1
      const transferAndCall = true
      await depositAndWithdraw(oe, checkBalances(), amount, transferAndCall)
    }).timeout(60000)
  })
})

import { parseEther } from '@ethersproject/units'
import { expect } from 'chai'
import { depositAndWithdraw, CheckBalances } from '../../../../scripts/deposit-withdraw'
import { optimism } from '../../../../src'
import * as h from '../../../helpers'

// Skip if not OVM integration test
;(h.isIntegration() ? describe : describe.skip)('Optimism deposit-withdraw @integration', () => {
  it('deposit L1->L2, withdraw L2->L1 @integration', async () => {
    let step = 0
    const _checkBalances: CheckBalances = async (
      l1Wallet,
      L1_ERC20,
      l2Wallet,
      OVM_L2DepositedERC20,
    ) => {
      const _expect = async (_l1Balance: string, _l2Balance: string) => {
        const l1Balance = await L1_ERC20.balanceOf(l1Wallet.address)
        expect(l1Balance).to.equal(_l1Balance)

        const l2Balance = await OVM_L2DepositedERC20.balanceOf(l2Wallet.address)
        expect(l2Balance).to.equal(_l2Balance)
      }

      switch (step++) {
        case 0:
          return await _expect('1000000000000000000000000000', '0')
        case 1:
          return await _expect('999999999999999999999999999', '0')
        case 2:
          return await _expect('999999999999999999999999999', '1')
        case 3:
          return await _expect('999999999999999999999999999', '0')
        case 4:
          return await _expect('1000000000000000000000000000', '0')
        default:
          expect(step).to.be.lte(4)
      }
    }

    // Load the configuration from environment
    const oe = await optimism.loadEnv()
    await oe.depositL2(parseEther('1'))
    // run test
    await depositAndWithdraw(oe, _checkBalances)
  }).timeout(60000)
})

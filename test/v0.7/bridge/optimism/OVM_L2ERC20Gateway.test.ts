import { expect } from 'chai'
import { Wallet, Contract } from 'ethers'
import { getContractFactory, deploy, Targets, Versions, optimism } from '../../../../src'
import * as h from '../../../helpers'

import { parseEther } from '@ethersproject/units'

// short alias
const _getFactory = getContractFactory

describe(`OVM_L2ERC20Gateway ${Versions.v0_7}`, () => {
  // Skip if not OVM integration test
  ;(h.isIntegration() ? describe : describe.skip)(`@integration`, () => {
    describe('withdrawal safety', () => {
      let oe: optimism.env.OptimismEnv, l2Token: Contract, l2Gateway: Contract

      before(async function () {
        this.timeout(20000)

        // Load the configuration from environment
        oe = await optimism.loadEnv()
        await oe.depositL2(parseEther('1'))

        // Deploy LinkTokenChild contract
        l2Token = await deploy(
          _getFactory('LinkTokenChild', oe.l2Wallet, Versions.v0_7, Targets.OVM),
          'LinkTokenChild',
        )

        // Deploy l2CrossDomainMessenger
        const messengerMock = await deploy(
          _getFactory('OVM_CrossDomainMessengerMock', oe.l2Wallet, Versions.v0_7, Targets.OVM),
          'OVM_CrossDomainMessengerMock',
        )
        const fake_l2CrossDomainMessenger = messengerMock.address

        // Deploy l2Gateway with l2CrossDomainMessenger
        l2Gateway = await deploy(
          _getFactory('OVM_L2ERC20Gateway', oe.l2Wallet, Versions.v0_7, Targets.OVM),
          'OVM_L2ERC20Gateway',
        )

        // Init L2 ERC20 Gateway
        const fake_l1ERC20Gateway = '0x00000000000000000000000000000000000000ff'
        const l2InitPayload = [fake_l1ERC20Gateway, fake_l2CrossDomainMessenger, l2Token.address]
        // TODO: What to do with DevEx here? (overloaded fn)
        const l2InitTx = await l2Gateway.init_2(...l2InitPayload)
        await l2InitTx.wait()

        // Grant BRIDGE_GATEWAY_ROLE role
        const gatewayRole = await l2Token.BRIDGE_GATEWAY_ROLE()
        const grantRoleTx1 = await l2Token.grantRole(gatewayRole, l2Gateway.address)
        await grantRoleTx1.wait()

        // Mock deposit $$$
        const grantRoleTx2 = await l2Token.grantRole(gatewayRole, oe.l2Wallet.address)
        await grantRoleTx2.wait()

        const depositTx = await l2Token.deposit(oe.l2Wallet.address, '1000000000000000000000000000')
        await depositTx.wait()
      })

      it('can withdraw (all fn) as EOA contract', async () => {
        const amountTotal = '30'
        const approveTx = await l2Token.approve(l2Gateway.address, amountTotal)
        await approveTx.wait()

        const amount = '10'
        const withdrawTx = await l2Gateway.withdraw(amount)
        await withdrawTx.wait()

        const withdrawToTx = await l2Gateway.withdrawTo(oe.l2Wallet.address, amount)
        await withdrawToTx.wait()

        const withdrawToUnsafeTx = await l2Gateway.withdrawToUnsafe(oe.l2Wallet.address, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(oe.l2Wallet.address)
        expect(balance).to.equal('999999999999999999999999970')
      }).timeout(20000)

      it('can withdrawTo an empty (unseen) account', async () => {
        const emptyAccPK = '0x' + '12345678'.repeat(8)
        const emptyAccWallet = new Wallet(emptyAccPK, oe.l2Wallet.provider)

        const amountTotal = '20'
        const approveTx = await l2Token.approve(l2Gateway.address, amountTotal)
        await approveTx.wait()

        const amount = '10'
        const withdrawToTx = await l2Gateway.withdrawTo(emptyAccWallet.address, amount)
        await withdrawToTx.wait()

        const withdrawToUnsafeTx = await l2Gateway.withdrawToUnsafe(emptyAccWallet.address, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(oe.l2Wallet.address)
        expect(balance).to.equal('999999999999999999999999950')
      }).timeout(10000)

      it("can't withdrawTo contract", async () => {
        const contractAddr = l2Token.address

        const amount = '10'
        const approveTx = await l2Token.approve(l2Gateway.address, amount)
        await approveTx.wait()

        const withdrawToTx = await l2Gateway.withdrawTo(
          contractAddr,
          amount,
          optimism.TX_OVERRIDES_OE_BUG,
        )

        // TODO: fetch revert reason
        // revert: Unsafe withdraw to contract
        await h.txRevert(withdrawToTx.wait())
      }).timeout(10000)

      it('can withdrawToUnsafe contract', async () => {
        const contractAddr = l2Token.address

        const amount = '10'
        const approveTx = await l2Token.approve(l2Gateway.address, amount)
        await approveTx.wait()

        const withdrawToUnsafeTx = await l2Gateway.withdrawToUnsafe(contractAddr, amount)
        await withdrawToUnsafeTx.wait()

        const balance = await l2Token.balanceOf(oe.l2Wallet.address)
        expect(balance).to.equal('999999999999999999999999940')
      }).timeout(10000)

      // TODO: refactor as reusable behavior
      describe('ERC677Receiver', () => {
        it('can transferAndCall from EOA', async () => {
          // Skip approval
          const amount = '10'

          const payload = [l2Gateway.address, amount, Buffer.from('')]
          const transferAndCallTx1 = await l2Token.transferAndCall(...payload)
          await transferAndCallTx1.wait()

          const transferAndCallTx2 = await l2Token.transferAndCall(...payload)
          await transferAndCallTx2.wait()

          const transferAndCallTx3 = await l2Token.transferAndCall(...payload)
          await transferAndCallTx3.wait()

          const balanceWallet = await l2Token.balanceOf(oe.l2Wallet.address)
          expect(balanceWallet).to.equal('999999999999999999999999910')

          const balanceGateway = await l2Token.balanceOf(l2Gateway.address)
          expect(balanceGateway).to.equal(0) // all burnt
        })

        it("can't transferAndCall from contract", async () => {
          const erc677CallerMock = await deploy(
            _getFactory('ERC677CallerMock', oe.l2Wallet, Versions.v0_7, Targets.OVM),
            'ERC677CallerMock',
          )

          // Fund the mock contract
          const amount = '10'
          const transferTx = await l2Token.transfer(erc677CallerMock.address, amount)
          await transferTx.wait()

          // Mock contract tries (fails) to transferAndCall to L1 Gateway
          const payload = [l2Token.address, l2Gateway.address, amount, Buffer.from('')]
          const callTransferAndCallTx = await erc677CallerMock.callTransferAndCall(
            ...payload,
            optimism.TX_OVERRIDES_OE_BUG,
          )

          // TODO: fetch revert reason
          // revert: Unsafe deposit to contract
          await h.txRevert(callTransferAndCallTx.wait())
        })
      })

      it("can't call onTokenTransfer directly", async () => {
        const amount = '10'
        const payload = [l2Token.address, amount, Buffer.from('')]
        const onTokenTransferTx = await l2Gateway.onTokenTransfer(
          ...payload,
          optimism.TX_OVERRIDES_OE_BUG,
        )

        // TODO: fetch revert reason
        // revert: onTokenTransfer sender not valid
        await h.txRevert(onTokenTransferTx.wait())
      })
    })
  })
})

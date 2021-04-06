import { expect } from 'chai'
import { Wallet, Contract, Signer, providers } from 'ethers'
import { OVML2DepositedLinkTokenMock as OVM_L2DepositedLinkTokenMock } from '../../../../build/types-ovm/v0.7/OVML2DepositedLinkTokenMock'
import { OVML2DepositedLinkTokenMock__factory as OVM_L2DepositedLinkTokenMock__factory } from '../../../../build/types-ovm/v0.7/factories/OVML2DepositedLinkTokenMock__factory'
import { OVMCrossDomainMessengerMock__factory as OVM_CrossDomainMessengerMock__factory } from '../../../../build/types-ovm/v0.7/factories/OVMCrossDomainMessengerMock__factory'
import { loadEnv } from '../../../../src/optimism'

import * as h from '../../../helpers'

export class OVM_L2DepositedLinkTokenTest__factory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  deploy(...args: Array<any>): Promise<OVM_L2DepositedLinkTokenMock> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      // Deploy l2CrossDomainMessenger
      const messengerMock = await new OVM_CrossDomainMessengerMock__factory(this.signer).deploy()
      await messengerMock.deployTransaction.wait()
      const fake_l2CrossDomainMessenger = messengerMock.address

      // Deploy l2Token with l2CrossDomainMessenger
      const l2Token = await new OVM_L2DepositedLinkTokenMock__factory(this.signer).deploy(
        fake_l2CrossDomainMessenger,
      )
      await l2Token.deployTransaction.wait()
      // Init l2Token with l1TokenGateway
      const address = await this.signer.getAddress()
      const fake_l1TokenGateway = address
      const initTx = await l2Token.init(fake_l1TokenGateway)
      await initTx.wait()

      // Mock deposit $$$
      const finalizeDepositTx = await l2Token.mockFinalizeDeposit(address, initBalance)
      await finalizeDepositTx.wait()

      return l2Token
    }

    return _deploy()
  }

  connect(signer: Signer): OVM_L2DepositedLinkTokenTest__factory {
    return new OVM_L2DepositedLinkTokenTest__factory(signer)
  }
}

describe('OVM_L2DepositedLinkToken v0.7 @integration', () => {
  // Skip if not OVM integration test
  ;(h.isIntegration() ? describe : describe.skip)('withdrawal safety', () => {
    // Load the configuration from environment
    loadEnv()

    const provider = new providers.JsonRpcProvider(process.env.L2_WEB3_URL)
    const wallet = new Wallet(process.env.USER_PRIVATE_KEY || '', provider)
    let l2Token: Contract

    beforeEach(async function() {
      this.timeout(20000)
      l2Token = await new OVM_L2DepositedLinkTokenTest__factory(wallet).deploy()
    })

    it('can withdraw (all fn) as EOA contract', async () => {
      const amount = '10'
      const withdrawTx = await l2Token.withdraw(amount)
      await withdrawTx.wait()

      const withdrawToTx = await l2Token.withdrawTo(wallet.address, amount)
      await withdrawToTx.wait()

      const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(wallet.address, amount)
      await withdrawToUnsafeTx.wait()

      const balance = await l2Token.balanceOf(wallet.address)
      expect(balance).to.equal('999999999999999999999999970')
    }).timeout(15000)

    it('can withdrawTo an empty (unseen) account', async () => {
      const emptyAccPK = '0x' + '12345678'.repeat(8)
      const emptyAccWallet = new Wallet(emptyAccPK, provider)

      const amount = '10'
      const withdrawToTx = await l2Token.withdrawTo(emptyAccWallet.address, amount)
      await withdrawToTx.wait()

      const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(emptyAccWallet.address, amount)
      await withdrawToUnsafeTx.wait()

      const balance = await l2Token.balanceOf(wallet.address)
      expect(balance).to.equal('999999999999999999999999980')
    }).timeout(10000)

    // it("can't withdrawTo contract", async () => {
    //   const contractAddr = l2Token.address

    //   const amount = '10'
    //   const withdrawToTx = await l2Token.withdrawTo(contractAddr, amount)

    //   // revert: Unsafe withdraw to contract
    //   await h.txRevert(withdrawToTx.wait())
    // }).timeout(20000)

    it('can withdrawToUnsafe contract', async () => {
      const contractAddr = l2Token.address

      const amount = '10'
      const withdrawToUnsafeTx = await l2Token.withdrawToUnsafe(contractAddr, amount)
      await withdrawToUnsafeTx.wait()

      const balance = await l2Token.balanceOf(wallet.address)
      expect(balance).to.equal('999999999999999999999999990')
    }).timeout(10000)
  })
})

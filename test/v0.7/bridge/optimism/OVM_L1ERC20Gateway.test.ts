import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { LinkToken__factory } from '../../../../build/types/v0.6/factories/LinkToken__factory'
import { OVML1ERC20Gateway__factory as OVM_L1ERC20Gateway__factory } from '../../../../build/types/v0.7/factories/OVML1ERC20Gateway__factory'
import { OVMCrossDomainMessengerMock__factory as OVM_CrossDomainMessengerMock__factory } from '../../../../build/types/v0.7/factories/OVMCrossDomainMessengerMock__factory'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Versions } from '../../../../src'

describe(`OVM_L1ERC20Gateway ${Versions.v0_7}`, () => {
  describe('deposit safety', () => {
    let wallet: SignerWithAddress, walletOther: SignerWithAddress

    before(async () => {
      ;[wallet, walletOther] = await ethers.getSigners()
    })

    let l1Token: Contract, l1Gateway: Contract

    beforeEach(async () => {
      l1Token = await new LinkToken__factory(wallet).deploy()

      const messengerMock = await new OVM_CrossDomainMessengerMock__factory(wallet).deploy()
      const fake_l1CrossDomainMessenger = messengerMock.address
      const fake_l2DepositedToken = '0x00000000000000000000000000000000000000ff'

      l1Gateway = await new OVM_L1ERC20Gateway__factory(wallet).deploy(
        l1Token.address,
        fake_l2DepositedToken,
        fake_l1CrossDomainMessenger,
      )
    })

    it('can deposit (all fn) as EOA contract', async () => {
      const totalAmount = '30'
      await l1Token.approve(l1Gateway.address, totalAmount)

      const amount = '10'
      await l1Gateway.deposit(amount)
      await l1Gateway.depositTo(wallet.address, amount)
      await l1Gateway.depositToUnsafe(wallet.address, amount)

      const balanceWallet = await l1Token.balanceOf(wallet.address)
      expect(balanceWallet).to.equal('999999999999999999999999970')

      const balanceGateway = await l1Token.balanceOf(l1Gateway.address)
      expect(balanceGateway).to.equal(totalAmount)
    })

    it('can depositTo other account', async () => {
      const totalAmount = '20'
      await l1Token.approve(l1Gateway.address, totalAmount)

      const amount = '10'
      await l1Gateway.depositTo(walletOther.address, amount)
      await l1Gateway.depositToUnsafe(walletOther.address, amount)

      const balanceWallet = await l1Token.balanceOf(wallet.address)
      expect(balanceWallet).to.equal('999999999999999999999999980')

      const balanceGateway = await l1Token.balanceOf(l1Gateway.address)
      expect(balanceGateway).to.equal(totalAmount)
    })

    it("can't depositTo contract", async () => {
      const totalAmount = '10'
      await l1Token.approve(l1Gateway.address, totalAmount)

      const contractAddr = l1Token.address
      const amount = totalAmount

      await expect(l1Gateway.depositTo(contractAddr, amount)).to.be.revertedWith(
        'Unsafe deposit to contract',
      )
    })

    it('can depositToUnsafe contract', async () => {
      const totalAmount = '10'
      await l1Token.approve(l1Gateway.address, totalAmount)

      const contractAddr = l1Token.address
      const amount = totalAmount
      await l1Gateway.depositToUnsafe(contractAddr, amount)

      const balanceWallet = await l1Token.balanceOf(wallet.address)
      expect(balanceWallet).to.equal('999999999999999999999999990')

      const balanceGateway = await l1Token.balanceOf(l1Gateway.address)
      expect(balanceGateway).to.equal(totalAmount)
    })
  })
})

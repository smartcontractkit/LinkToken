import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Versions, getContractFactory, Targets, optimism } from '../../../../src'

describe(`OVM_L1ERC20Gateway ${Versions.v0_7}`, () => {
  describe('deposit safety', () => {
    let wallet: SignerWithAddress, walletOther: SignerWithAddress

    before(async () => {
      ;[wallet, walletOther] = await ethers.getSigners()
    })

    let l1Token: Contract, l1Gateway: Contract

    beforeEach(async () => {
      l1Token = await getContractFactory('LinkToken', wallet, Versions.v0_6, Targets.EVM).deploy()

      const messengerMock = await getContractFactory(
        'OVM_CrossDomainMessengerMock',
        wallet,
        Versions.v0_7,
        Targets.EVM,
      ).deploy()
      const fake_l1CrossDomainMessenger = messengerMock.address
      const fake_l2ERC20Gateway = '0x00000000000000000000000000000000000000ff'

      l1Gateway = await optimism.deployL1ERC20Gateway(wallet)
      // Init L2 ERC20 Gateway
      const l1InitPayload = [fake_l2ERC20Gateway, fake_l1CrossDomainMessenger, l1Token.address]
      const l1InitTx = await l1Gateway.init(...l1InitPayload)
      await l1InitTx.wait()
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

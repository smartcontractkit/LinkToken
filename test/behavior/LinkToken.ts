import { ethers } from 'hardhat'
import { expect } from 'chai'
import { ContractFactory, Contract, BigNumber, Signer } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import * as h from '../helpers'

export const shouldBehaveLikeLinkToken = (
  getContractFactory: (name: string, signer?: Signer) => ContractFactory,
  getReasonStr: (reason: string) => string,
  extraPublicABI: string[],
) => {
  describe('LinkToken', () => {
    let owner: SignerWithAddress, sender: SignerWithAddress, recipient: Contract, token: Contract

    before(async () => {
      ;[owner, sender] = await ethers.getSigners()
    })

    beforeEach(async () => {
      token = await getContractFactory('LinkToken', owner).deploy()
    })

    it('has a limited public ABI', () => {
      const expectedABI = [
        //public attributes
        'decimals',
        'name',
        'symbol',
        'totalSupply',
        //public functions
        'allowance',
        'approve',
        'balanceOf',
        'decreaseApproval',
        'increaseApproval',
        'transfer',
        'transferAndCall',
        'transferFrom',
        ...extraPublicABI,
      ]

      h.publicAbi(token, expectedABI)
    })

    it('assigns all of the balance to the owner', async () => {
      const balance = await token.balanceOf(owner.address)

      expect(balance.toString()).to.equal('1000000000000000000000000000')
    })

    describe('#transfer(address,uint256)', () => {
      let receiver: Contract, transferAmount: number

      beforeEach(async () => {
        receiver = await getContractFactory('Token677ReceiverMock', owner).deploy()
        transferAmount = 100

        await token.connect(owner).transfer(sender.address, transferAmount)
        const val = await receiver.sentValue()
        expect(val).to.equal(0)
      })

      it('does not let you transfer to the null address', async () => {
        await expect(
          token.connect(sender).transfer(ethers.constants.AddressZero, transferAmount),
        ).to.be.revertedWith(getReasonStr('ERC20: transfer to the zero address'))
      })

      it('does not let you transfer to the contract itself', async () => {
        await expect(
          token.connect(sender).transfer(token.address, transferAmount),
        ).to.be.revertedWith(getReasonStr('LinkToken: transfer/approve to this contract address'))
      })

      it('transfers the tokens', async () => {
        let balance = await token.balanceOf(receiver.address)
        expect(balance).to.equal(0)

        await token.connect(sender).transfer(receiver.address, transferAmount)

        balance = await token.balanceOf(receiver.address)
        expect(balance).to.equal(transferAmount)
      })

      it('does NOT call the fallback on transfer', async () => {
        await token.connect(sender).transfer(receiver.address, transferAmount)

        expect(await receiver.calledFallback()).to.be.false
      })

      it('transfer succeeds with response', async () => {
        const response = await token.connect(sender).transfer(receiver.address, transferAmount)
        expect(response).to.exist
      })

      it('throws when the transfer fails', async () => {
        await expect(token.connect(sender).transfer(receiver.address, 100000)).to.be.revertedWith(
          getReasonStr('ERC20: transfer amount exceeds balance'),
        )
      })

      describe('when sending to a contract that is not ERC677 compatible', () => {
        let nonERC677: Contract

        beforeEach(async () => {
          nonERC677 = await getContractFactory('NotERC677Compatible', owner).deploy()
        })

        it('transfers the token', async () => {
          let balance = await token.balanceOf(nonERC677.address)
          expect(balance).to.equal(0)

          await token.connect(sender).transfer(nonERC677.address, transferAmount)

          balance = await token.balanceOf(nonERC677.address)
          expect(balance).to.equal(transferAmount)
        })
      })
    })

    describe('#transfer(address,uint256,bytes)', () => {
      const value = 1000

      beforeEach(async () => {
        recipient = await getContractFactory('LinkReceiver', owner).deploy()
        const allowance = await token.allowance(owner.address, recipient.address)
        expect(allowance).to.equal(0)

        const balance = await token.balanceOf(recipient.address)
        expect(balance).to.equal(0)
      })

      it('does not let you transfer to an empty address', async () => {
        const data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(ethers.constants.AddressZero) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await expect(owner.sendTransaction({ to: token.address, data })).to.be.revertedWith(
          getReasonStr('ERC20: transfer to the zero address'),
        )
      })

      it('does not let you transfer to the contract itself', async () => {
        const data =
          '0x' +
          h.functionID('transfer(address,uint256)') +
          h.encodeAddress(token.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await expect(owner.sendTransaction({ to: token.address, data })).to.be.revertedWith(
          getReasonStr('LinkToken: transfer/approve to this contract address'),
        )
      })

      it('transfers the amount to the contract and calls the contract', async () => {
        const data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(recipient.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('043e94bd') // callbackWithoutWithdrawl()

        await owner.sendTransaction({ to: token.address, data })

        const balance = await token.balanceOf(recipient.address)
        expect(balance).to.equal(value)

        const allowance = await token.allowance(owner.address, recipient.address)
        expect(allowance).to.equal(0)

        expect(await recipient.fallbackCalled()).to.be.true
        expect(await recipient.callDataCalled()).to.be.true
      })

      it('does not blow up if no data is passed', async () => {
        const data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(recipient.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await owner.sendTransaction({ to: token.address, data })

        expect(await recipient.fallbackCalled()).to.be.true
        expect(await recipient.callDataCalled()).to.be.false
      })
    })

    describe('#approve', () => {
      const amount = 1000

      it('allows token approval amounts to be updated without first resetting to zero', async () => {
        const originalApproval = BigNumber.from(1000)
        await token.connect(owner).approve(recipient.address, originalApproval)
        let approvedAmount = await token.allowance(owner.address, recipient.address)
        expect(approvedAmount).to.equal(originalApproval)

        const laterApproval = BigNumber.from(2000)
        await token.connect(owner).approve(recipient.address, laterApproval)
        approvedAmount = await token.allowance(owner.address, recipient.address)
        expect(approvedAmount).to.equal(laterApproval)
      })

      it('throws an error when approving the null address', async () => {
        await expect(
          token.connect(owner).approve(ethers.constants.AddressZero, amount),
        ).to.be.revertedWith(getReasonStr('ERC20: approve to the zero address'))
      })

      it('throws an error when approving the token itself', async () => {
        await expect(token.connect(owner).approve(token.address, amount)).to.be.revertedWith(
          getReasonStr('LinkToken: transfer/approve to this contract address'),
        )
      })
    })

    describe('#transferFrom', () => {
      const amount = 1000

      beforeEach(async () => {
        await token.connect(owner).transfer(sender.address, amount)
        await token.connect(sender).approve(owner.address, amount)
      })

      it('throws an error when transferring to the null address', async () => {
        await expect(
          token.connect(owner).transferFrom(sender.address, ethers.constants.AddressZero, amount),
        ).to.be.revertedWith(getReasonStr('ERC20: transfer to the zero address'))
      })

      it('throws an error when transferring to the token itself', async () => {
        await expect(
          token.connect(owner).transferFrom(sender.address, token.address, amount),
        ).to.be.revertedWith(getReasonStr('LinkToken: transfer/approve to this contract address'))
      })
    })
  })
}

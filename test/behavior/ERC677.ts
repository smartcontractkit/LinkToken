import { ethers } from 'hardhat'
import { expect } from 'chai'
import { ContractFactory, Contract, Signer } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import * as h from '../helpers'

export const shouldBehaveLikeERC677 = (
  getContractFactory: (name: string, signer?: Signer) => ContractFactory,
  getReasonStr: (reason: string) => string,
) => {
  describe('ERC677', () => {
    let defaultAccount: SignerWithAddress

    before(async () => {
      ;[defaultAccount] = await ethers.getSigners()
    })

    let receiver: Contract, sender: SignerWithAddress, token: Contract, transferAmount: number

    beforeEach(async () => {
      sender = defaultAccount
      receiver = await getContractFactory('Token677ReceiverMock', sender).deploy()
      token = await getContractFactory('Token677', sender).deploy(1000)
      transferAmount = 100

      await token.connect(sender).transfer(sender.address, transferAmount)
      const val = await receiver.sentValue()
      expect(val).to.equal(0)
    })

    describe('#transferAndCall(address, uint, bytes)', () => {
      let params: any

      beforeEach(() => {
        const data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(receiver.address) +
          h.encodeUint256(transferAmount) +
          h.encodeUint256(96) +
          h.encodeBytes('deadbeef')
        params = { to: token.address, data, gasLimit: 1000000 }
      })

      it('transfers the tokens', async () => {
        let balance = await token.balanceOf(receiver.address)
        expect(balance).to.equal(0)

        await sender.sendTransaction(params)

        balance = await token.balanceOf(receiver.address)
        expect(balance).to.equal(transferAmount)
      })

      it('calls the token fallback function on transfer', async () => {
        await sender.sendTransaction(params)
        const calledFallback = await receiver.calledFallback()
        expect(calledFallback).to.be.true

        const tokenSender = await receiver.tokenSender()
        expect(tokenSender).to.equal(await sender.getAddress())

        const sentValue = await receiver.sentValue()
        expect(sentValue).to.equal(transferAmount)
      })

      it('transfer succeeds with response', async () => {
        const response = await sender.sendTransaction(params)
        expect(response).to.exist
      })

      it('throws when the transfer fails', async () => {
        const data =
          '0x' +
          h.functionID('transfer(address,uint256)') +
          h.encodeAddress(receiver.address) +
          h.encodeUint256(100000) +
          h.encodeUint256(96) +
          h.encodeBytes('deadbeef')
        params = { to: token.address, data, gasLimit: 1000000 }

        await expect(sender.sendTransaction(params)).to.be.revertedWith(
          getReasonStr('ERC20: transfer amount exceeds balance'),
        )
      })

      describe('when sending to a contract that is not ERC677 compatible', () => {
        let nonERC677: Contract

        beforeEach(async () => {
          nonERC677 = await getContractFactory('NotERC677Compatible', sender).deploy()
          const data =
            '0x' +
            h.functionID('transferAndCall(address,uint256,bytes)') +
            h.encodeAddress(nonERC677.address) +
            h.encodeUint256(100000) +
            h.encodeUint256(96) +
            h.encodeBytes('deadbeef')
          params = { to: token.address, data, gasLimit: 1000000 }
        })

        it('throws an error', async () => {
          await expect(sender.sendTransaction(params)).to.be.revertedWith(
            getReasonStr('ERC20: transfer amount exceeds balance'),
          )

          const balance = await token.balanceOf(nonERC677.address)
          expect(balance).to.equal(0)
        })
      })
    })
  })
}

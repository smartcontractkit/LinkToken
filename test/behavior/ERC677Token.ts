import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { ContractFactory, Contract } from 'ethers'
import * as h from '../helpers'

export const shouldBehaveLikeERC677Token = (
  token677Factory: ContractFactory,
  token677ReceiverMockFactory: ContractFactory,
  notERC677CompatibleFactory: ContractFactory,
) => {
  describe('ERC677Token', () => {
    let defaultAccount: SignerWithAddress

    before(async () => {
      ;[defaultAccount] = await ethers.getSigners()
    })

    let receiver: Contract, sender: SignerWithAddress, token: Contract, transferAmount: number

    beforeEach(async () => {
      sender = defaultAccount
      receiver = await token677ReceiverMockFactory.connect(sender).deploy()
      token = await token677Factory.connect(sender).deploy(1000)
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
        expect(tokenSender).to.equal(sender.address)

        const sentValue = await receiver.sentValue()
        expect(sentValue).to.equal(transferAmount)
      })

      it('returns true when the transfer succeeds', async () => {
        const success = await sender.sendTransaction(params)
        expect(success).to.be.true
      })

      it('throws when the transfer fails', async () => {
        const data =
          '0x' +
          'be45fd62' + // transfer(address,uint256,bytes)
          h.encodeAddress(receiver.address) +
          h.encodeUint256(100000) +
          h.encodeUint256(96) +
          h.encodeBytes('deadbeef')
        params = { to: token.address, data, gasLimit: 1000000 }

        await expect(sender.sendTransaction(params)).to.be.revertedWith(
          'VM Exception while processing transaction:',
        )
      })

      describe('when sending to a contract that is not ERC677 compatible', () => {
        let nonERC677: Contract

        beforeEach(async () => {
          nonERC677 = await notERC677CompatibleFactory.connect(sender).deploy()
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
            'VM Exception while processing transaction:',
          )

          const balance = await token.balanceOf(nonERC677.address)
          expect(balance).to.equal(0)
        })
      })
    })
  })
}

import { Wallet, ContractFactory, Contract } from 'ethers'
import { BigNumber } from 'ethers/utils'
import { setup, matchers } from '@chainlink/test-helpers'
import * as h from '../helpers'

export const shouldBehaveLikeLinkToken = (
  linkTokenFactory: ContractFactory,
  linkReceiverFactory: ContractFactory,
  Token677ReceiverMockFactory: ContractFactory,
  notERC677CompatibleFactory: ContractFactory,
  extraPublicABI: string[],
) => {
  describe('ERC677Token', () => {
    const provider = setup.provider()

    // @ts-ignore
    let allowance: number, owner: Wallet, sender: Wallet, recipient: Contract, token: Contract

    beforeAll(async () => {
      const users = await setup.users(provider)
      owner = users.roles.defaultAccount
      sender = users.roles.stranger
    })

    beforeEach(async () => {
      token = await linkTokenFactory.connect(owner).deploy()
    })

    it('has a limited public ABI', () => {
      let expectedABI = [
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

      matchers.publicAbi(token, expectedABI)
    })

    it('assigns all of the balance to the owner', async () => {
      const balance = await token.balanceOf(owner.address)

      expect(balance.toString()).toEqual('1000000000000000000000000000')
    })

    describe('#transfer(address,uint256)', () => {
      let receiver: Contract, transferAmount: number

      beforeEach(async () => {
        receiver = await Token677ReceiverMockFactory.connect(owner).deploy()
        transferAmount = 100

        await token.connect(owner).transfer(sender.address, transferAmount)
        const val = await receiver.sentValue()
        expect(val.eq(0)).toBeTruthy()
      })

      it('does not let you transfer to the null address', async () => {
        await matchers.evmRevert(
          token.connect(sender).transfer(h.EMPTY_ADDRESS, transferAmount),
          'VM Exception while processing transaction:',
        )
      })

      it('does not let you transfer to the contract itself', async () => {
        await matchers.evmRevert(
          token.connect(sender).transfer(token.address, transferAmount),
          'VM Exception while processing transaction:',
        )
      })

      it('transfers the tokens', async () => {
        let balance = await token.balanceOf(receiver.address)
        expect(balance.eq(0)).toBeTruthy()

        await token.connect(sender).transfer(receiver.address, transferAmount)

        balance = await token.balanceOf(receiver.address)
        expect(balance.eq(transferAmount)).toBeTruthy()
      })

      it('does NOT call the fallback on transfer', async () => {
        await token.connect(sender).transfer(receiver.address, transferAmount)

        expect(await receiver.calledFallback()).toBeFalsy()
      })

      it('returns true when the transfer succeeds', async () => {
        let success = await token.connect(sender).transfer(receiver.address, transferAmount)
        expect(success).toBeTruthy()
      })

      it('throws when the transfer fails', async () => {
        await matchers.evmRevert(
          token.connect(sender).transfer(receiver.address, 100000),
          'VM Exception while processing transaction:',
        )
      })

      describe('when sending to a contract that is not ERC677 compatible', () => {
        let nonERC677: Contract

        beforeEach(async () => {
          nonERC677 = await notERC677CompatibleFactory.connect(owner).deploy()
        })

        it('transfers the token', async () => {
          let balance = await token.balanceOf(nonERC677.address)
          expect(balance.eq(0)).toBeTruthy()

          await token.connect(sender).transfer(nonERC677.address, transferAmount)

          balance = await token.balanceOf(nonERC677.address)
          expect(balance.eq(transferAmount)).toBeTruthy()
        })
      })
    })

    describe('#transfer(address,uint256,bytes)', () => {
      let value = 1000

      beforeEach(async () => {
        recipient = await linkReceiverFactory.connect(owner).deploy()
        const allowance = await token.allowance(owner.address, recipient.address)
        expect(allowance.eq(0)).toBeTruthy()

        const balance = await token.balanceOf(recipient.address)
        expect(balance.eq(0)).toBeTruthy()
      })

      it('does not let you transfer to an empty address', async () => {
        let data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(token.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await matchers.evmRevert(
          owner.sendTransaction({ to: token.address, data }),
          'VM Exception while processing transaction:',
        )
      })

      it('does not let you transfer to the contract itself', async () => {
        let data =
          '0x' +
          'be45fd62' + // transfer(address,uint256,bytes)
          h.encodeAddress(h.EMPTY_ADDRESS) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await matchers.evmRevert(
          owner.sendTransaction({ to: token.address, data }),
          'VM Exception while processing transaction:',
        )
      })

      it('transfers the amount to the contract and calls the contract', async () => {
        let data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(recipient.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('043e94bd') // callbackWithoutWithdrawl()

        await owner.sendTransaction({ to: token.address, data })

        const balance = await token.balanceOf(recipient.address)
        expect(balance.eq(value)).toBeTruthy()

        const allowance = await token.allowance(owner.address, recipient.address)
        expect(allowance.eq(0)).toBeTruthy()

        expect(await recipient.fallbackCalled()).toBeTruthy()
        expect(await recipient.callDataCalled()).toBeTruthy()
      })

      it('does not blow up if no data is passed', async () => {
        let data =
          '0x' +
          h.functionID('transferAndCall(address,uint256,bytes)') +
          h.encodeAddress(recipient.address) +
          h.encodeUint256(value) +
          h.encodeUint256(96) +
          h.encodeBytes('')

        await owner.sendTransaction({ to: token.address, data: data })

        expect(await recipient.fallbackCalled()).toBeTruthy()
        expect(await recipient.callDataCalled()).toBeFalsy()
      })
    })

    describe('#approve', () => {
      let amount = 1000

      it('allows token approval amounts to be updated without first resetting to zero', async () => {
        let originalApproval = new BigNumber(1000)
        await token.connect(owner).approve(recipient.address, originalApproval)
        let approvedAmount = await token.allowance(owner.address, recipient.address)
        expect(approvedAmount.eq(originalApproval)).toBeTruthy()

        let laterApproval = new BigNumber(2000)
        await token.connect(owner).approve(recipient.address, laterApproval)
        approvedAmount = await token.allowance(owner.address, recipient.address)
        expect(approvedAmount.eq(laterApproval)).toBeTruthy()
      })

      it('throws an error when approving the null address', async () => {
        await matchers.evmRevert(
          token.connect(owner).approve(h.EMPTY_ADDRESS, amount),
          'VM Exception while processing transaction:',
        )
      })

      it('throws an error when approving the token itself', async () => {
        await matchers.evmRevert(
          token.connect(owner).approve(token.address, amount),
          'VM Exception while processing transaction:',
        )
      })
    })

    describe('#transferFrom', () => {
      let amount = 1000

      beforeEach(async () => {
        await token.connect(owner).transfer(sender.address, amount)
        await token.connect(sender).approve(owner.address, amount)
      })

      it('throws an error when transferring to the null address', async () => {
        await matchers.evmRevert(
          token.connect(owner).transferFrom(sender.address, h.EMPTY_ADDRESS, amount),
          'VM Exception while processing transaction:',
        )
      })

      it('throws an error when transferring to the token itself', async () => {
        await matchers.evmRevert(
          token.connect(owner).transferFrom(sender.address, token.address, amount),
          'VM Exception while processing transaction:',
        )
      })
    })
  })
}

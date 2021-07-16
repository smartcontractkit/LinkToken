import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { ContractFactory, Contract, Signer } from 'ethers'

export const shouldBehaveLikeStandardToken = (
  getContractFactory: (name: string, signer?: Signer) => ContractFactory,
  getReasonStr: (reason: string) => string,
) => {
  describe('StandardToken', () => {
    let personas: { [key: string]: SignerWithAddress } = {}
    let defaultAccount: SignerWithAddress

    before(async () => {
      ;[defaultAccount, personas.Eddy, personas.Carol, personas.Nelly] = await ethers.getSigners()
    })

    let token: Contract

    beforeEach(async () => {
      const factory = getContractFactory('StandardTokenMock', defaultAccount)
      token = await factory.deploy(personas.Carol.address, 100)
    })

    it('should return the correct allowance amount after approval', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 100)
      const allowance = await token.allowance(personas.Carol.address, personas.Eddy.address)
      expect(allowance).to.equal(100)
    })

    it('should return correct balances after transferring from another account', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 100)

      await token
        .connect(personas.Eddy)
        .transferFrom(personas.Carol.address, personas.Nelly.address, 100)

      const balance0 = await token.balanceOf(personas.Carol.address)
      expect(balance0).to.equal(0)

      const balance1 = await token.balanceOf(personas.Nelly.address)
      expect(balance1).to.equal(100)

      const balance2 = await token.balanceOf(personas.Eddy.address)
      expect(balance2).to.equal(0)
    })

    it('should throw an error when trying to transfer more than allowed', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 99)

      await expect(
        token
          .connect(personas.Eddy)
          .transferFrom(personas.Carol.address, personas.Nelly.address, 100),
      ).to.be.revertedWith(getReasonStr('ERC20: transfer amount exceeds allowance'))
    })

    describe('validating allowance updates to spender', () => {
      it('should start with zero', async () => {
        const preApproved = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(preApproved).to.equal(0)
      })

      it('should increase by 50 then decrease by 10', async () => {
        const preApproved = await token.allowance(personas.Carol.address, personas.Eddy.address)

        await token.connect(personas.Carol).increaseApproval(personas.Eddy.address, 50)
        const postIncrease = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(preApproved.add(50)).to.equal(postIncrease)

        await token.connect(personas.Carol).decreaseApproval(personas.Eddy.address, 10)
        const postDecrease = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(postIncrease.sub(10)).to.equal(postDecrease)
      })
    })
  })
}

import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { ContractFactory, Contract, Signer } from 'ethers'

export const shouldBehaveLikeBasicToken = (
  getContractFactory: (name: string, signer?: Signer) => ContractFactory,
  getReasonStr: (reason: string) => string,
) => {
  describe('BasicToken', () => {
    let personas: { [key: string]: SignerWithAddress } = {}
    let defaultAccount: SignerWithAddress

    before(async () => {
      ;[defaultAccount, personas.Carol] = await ethers.getSigners()
    })

    let token: Contract

    beforeEach(async () => {
      const factory = getContractFactory('BasicTokenMock', defaultAccount)
      token = await factory.deploy(defaultAccount.address, 100)
    })

    it('should return the correct totalSupply after construction', async () => {
      const totalSupply = await token.totalSupply()

      expect(totalSupply).to.equal(100)
    })

    it('should return correct balances after transfer', async () => {
      await token.connect(defaultAccount).transfer(personas.Carol.address, 100)

      const firstAccountBalance = await token.balanceOf(defaultAccount.address)
      expect(firstAccountBalance).to.equal(0)

      const secondAccountBalance = await token.balanceOf(personas.Carol.address)
      expect(secondAccountBalance).to.equal(100)
    })

    it('should throw an error when trying to transfer more than balance', async function () {
      await expect(
        token.connect(defaultAccount).transfer(personas.Carol.address, 101),
      ).to.be.revertedWith(getReasonStr('ERC20: transfer amount exceeds balance'))
    })
  })
}

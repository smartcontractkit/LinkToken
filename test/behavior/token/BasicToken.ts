import { Wallet, ContractFactory, Contract } from 'ethers'
import { setup, matchers } from '@chainlink/test-helpers'

export const shouldBehaveLikeBasicToken = (factory: ContractFactory) => {
  describe('BasicToken', () => {
    let personas: setup.Personas
    let defaultAccount: Wallet

    const provider = setup.provider()

    beforeAll(async () => {
      const users = await setup.users(provider)
      personas = users.personas
      defaultAccount = users.roles.defaultAccount
    })

    let token: Contract

    beforeEach(async () => {
      token = await factory.connect(defaultAccount).deploy(personas.Default.address, 100)
    })

    it('should return the correct totalSupply after construction', async () => {
      const totalSupply = await token.totalSupply()

      expect(totalSupply.eq(100)).toBeTruthy()
    })

    it('should return correct balances after transfer', async () => {
      await token.connect(defaultAccount).transfer(personas.Carol.address, 100)

      const firstAccountBalance = await token.balanceOf(defaultAccount.address)
      expect(firstAccountBalance.eq(0)).toBeTruthy()

      const secondAccountBalance = await token.balanceOf(personas.Carol.address)
      expect(secondAccountBalance.eq(100)).toBeTruthy()
    })

    it('should throw an error when trying to transfer more than balance', async function() {
      matchers.evmRevert(
        token.connect(defaultAccount).transfer(personas.Carol.address, 101),
        'VM Exception while processing transaction:',
      )
    })
  })
}

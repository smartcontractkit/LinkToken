import { Wallet, ContractFactory, Contract } from 'ethers'
import { setup, matchers } from '@chainlink/test-helpers'

export const shouldBehaveLikeStandardToken = (factory: ContractFactory) => {
  describe('StandardToken', () => {
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
      token = await factory.connect(defaultAccount).deploy(personas.Carol.address, 100)
    })

    it('should return the correct allowance amount after approval', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 100)
      const allowance = await token.allowance(personas.Carol.address, personas.Eddy.address)
      expect(allowance.eq(100)).toBeTruthy()
    })

    it('should return correct balances after transferring from another account', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 100)

      await token
        .connect(personas.Eddy)
        .transferFrom(personas.Carol.address, personas.Nelly.address, 100)

      let balance0 = await token.balanceOf(personas.Carol.address)
      expect(balance0.eq(0)).toBeTruthy()

      let balance1 = await token.balanceOf(personas.Nelly.address)
      expect(balance1.eq(100)).toBeTruthy()

      let balance2 = await token.balanceOf(personas.Eddy.address)
      expect(balance2.eq(0)).toBeTruthy()
    })

    it('should throw an error when trying to transfer more than allowed', async () => {
      await token.connect(personas.Carol).approve(personas.Eddy.address, 99)

      matchers.evmRevert(
        token
          .connect(personas.Eddy)
          .transferFrom(personas.Carol.address, personas.Nelly.address, 100),
        'VM Exception while processing transaction:',
      )
    })

    describe('validating allowance updates to spender', () => {
      it('should start with zero', async () => {
        const preApproved = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(preApproved.eq(0)).toBeTruthy()
      })

      it('should increase by 50 then decrease by 10', async () => {
        const preApproved = await token.allowance(personas.Carol.address, personas.Eddy.address)

        await token.connect(personas.Carol).increaseApproval(personas.Eddy.address, 50)
        const postIncrease = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(preApproved.add(50).eq(postIncrease)).toBeTruthy()

        await token.connect(personas.Carol).decreaseApproval(personas.Eddy.address, 10)
        const postDecrease = await token.allowance(personas.Carol.address, personas.Eddy.address)
        expect(postIncrease.sub(10).eq(postDecrease)).toBeTruthy()
      })
    })
  })
}

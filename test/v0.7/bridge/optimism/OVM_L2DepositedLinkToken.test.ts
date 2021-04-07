import { ContractFactory, Signer } from 'ethers'
import { OVML2DepositedLinkToken as OVM_L2DepositedLinkToken } from '../../../../build/types/v0.7/OVML2DepositedLinkToken'
import { OVML2DepositedLinkTokenMock__factory as OVM_L2DepositedLinkTokenMock__factory } from '../../../../build/types/v0.7/factories/OVML2DepositedLinkTokenMock__factory'
import { OVMCrossDomainMessengerMock__factory as OVM_CrossDomainMessengerMock__factory } from '../../../../build/types/v0.7/factories/OVMCrossDomainMessengerMock__factory'

import { shouldBehaveLikeLinkToken } from '../../../behavior/LinkToken'

import { getContractFactory, Versions } from '../../../../src'

export class OVM_L2DepositedLinkTokenTest__factory {
  readonly signer: Signer
  constructor(signer?: Signer) {
    this.signer = signer || ({} as Signer)
  }

  deploy(...args: Array<any>): Promise<OVM_L2DepositedLinkToken> {
    const initBalance: number = args[0] || '1000000000000000000000000000'
    const _deploy = async () => {
      // Deploy l2CrossDomainMessenger
      const messengerMock = await new OVM_CrossDomainMessengerMock__factory(this.signer).deploy()
      await messengerMock.deployTransaction.wait()
      const fake_l2CrossDomainMessenger = messengerMock.address

      // Deploy l2Token with l2CrossDomainMessenger
      const l2Token = await new OVM_L2DepositedLinkTokenMock__factory(this.signer).deploy(
        fake_l2CrossDomainMessenger,
      )
      await l2Token.deployTransaction.wait()
      // Init l2Token with l1TokenGateway
      const address = await this.signer.getAddress()
      const fake_l1TokenGateway = address
      const initTx = await l2Token.init(fake_l1TokenGateway)
      await initTx.wait()

      // Mock deposit $$$
      const finalizeDepositTx = await l2Token.mockFinalizeDeposit(address, initBalance)
      await finalizeDepositTx.wait()

      return l2Token
    }

    return _deploy()
  }

  connect(signer: Signer): OVM_L2DepositedLinkTokenTest__factory {
    return new OVM_L2DepositedLinkTokenTest__factory(signer)
  }
}

const OVM_EOACodeHashSet_PUBLIC_ABI = [
  'owner',
  'transferOwnership',
  'acceptOwnership',
  'containsEOACodeHash',
  'addEOACodeHash',
  'removeEOACodeHash',
]
const Abs_L2DepositedToken_PUBLIC_ABI = [
  'messenger',
  'l1TokenGateway',
  'init',
  'getFinalizeWithdrawalL1Gas',
  'withdraw',
  'withdrawTo',
  'withdrawToUnsafe',
  'finalizeDeposit',
]
const OVM_L2DepositedLinkTokenMock_PUBLIC_ABI = ['mockFinalizeDeposit']
const EXTRA_PUBLIC_ABI = [
  'decreaseAllowance',
  'increaseAllowance',
  ...OVM_EOACodeHashSet_PUBLIC_ABI,
  ...Abs_L2DepositedToken_PUBLIC_ABI,
  ...OVM_L2DepositedLinkTokenMock_PUBLIC_ABI,
]

describe(`OVM_L2DepositedLinkToken ${Versions.v0_7}`, () => {
  const _getContractFactory = (name: string, signer?: Signer) => {
    if (name === 'LinkToken') {
      return (new OVM_L2DepositedLinkTokenTest__factory(signer) as unknown) as ContractFactory
    }
    return getContractFactory(name, signer, Versions.v0_6)
  }
  const _getReasonStr = (reason: string) => reason

  shouldBehaveLikeLinkToken(_getContractFactory, _getReasonStr, EXTRA_PUBLIC_ABI)
})

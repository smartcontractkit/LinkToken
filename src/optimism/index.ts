import { Wallet, Contract, Signer } from 'ethers'
import { getContractFactory, Targets, Versions } from '../'
import { deploy, deployProxy } from '../contract-defs'

export * from '@chainlink/optimism-utils'

export const deployGateways = async (
  l1Wallet: Wallet,
  l2Wallet: Wallet,
  l1ERC20Address: string,
  l2ERC20Address: string,
  l1MessengerAddress: string,
  l2MessengerAddress: string,
  isProxyDeployment = true,
): Promise<{
  l1ERC20Gateway: Contract
  l2ERC20Gateway: Contract
}> => {
  // Deploy L2 ERC20 Gateway
  const l2ERC20Gateway = await deployL2ERC20Gateway(l2Wallet, isProxyDeployment)

  // Deploy & Init L1 ERC20 Gateway
  const l1ERC20Gateway = await deployL1ERC20Gateway(l1Wallet, isProxyDeployment)

  const l1InitPayload = [l2ERC20Gateway.address, l1MessengerAddress, l1ERC20Address]
  const l1InitTx = await l1ERC20Gateway.initialize(...l1InitPayload)
  await l1InitTx.wait()
  console.log('OVM_L1ERC20Gateway initialized with:', l1InitPayload)

  // Init L2 ERC20 Gateway
  const l2InitPayload = [l1ERC20Gateway.address, l2MessengerAddress, l2ERC20Address]
  const l2InitTx = await l2ERC20Gateway.initialize(...l2InitPayload)
  await l2InitTx.wait()
  console.log('OVM_L2ERC20Gateway initialized with:', l2InitPayload)

  return {
    l1ERC20Gateway,
    l2ERC20Gateway,
  }
}

export const deployL1ERC20Gateway = async (l1Signer: Signer, proxy: boolean = false) => {
  // Deploy L1 ERC20 Gateway
  const l1ERC20Gateway = await deploy(
    getContractFactory('OVM_L1ERC20Gateway', l1Signer, Versions.v0_7, Targets.EVM),
    'OVM_L1ERC20Gateway',
  )

  if (!proxy) return l1ERC20Gateway

  // Deploy L2 ERC20 Gateway Proxy
  const logic = l1ERC20Gateway
  return (await deployProxy(l1Signer, Targets.EVM, logic)).proxy
}

export const deployL2ERC20Gateway = async (l2Signer: Signer, isProxyDeployment: boolean = false) => {
  // Deploy L2 ERC20 Gateway
  const l2ERC20Gateway = await deploy(
    getContractFactory('OVM_L2ERC20Gateway', l2Signer, Versions.v0_7, Targets.OVM),
    'OVM_L2ERC20Gateway',
  )

  if (!isProxyDeployment) return l2ERC20Gateway

  // Deploy L2 ERC20 Gateway Proxy
  const logic = l2ERC20Gateway
  return (await deployProxy(l2Signer, Targets.OVM, logic)).proxy
}

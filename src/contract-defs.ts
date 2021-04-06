import * as path from 'path'
import * as glob from 'glob'
import { uniqBy } from 'lodash'
import { ethers, ContractFactory, Signer, Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { Targets, Versions } from '.'

export const getContractDefinition = (
  name: string,
  version?: Versions,
  target: Targets = Targets.EVM,
): any => {
  const match = glob.sync(
    path.resolve(__dirname, '../build') +
      `/artifacts${target ? `-${target}` : ''}` +
      `/contracts${version ? `/v${version}` : ''}` +
      `/**/${name}.json`,
  )

  if (match.length === 0) throw new Error(`Unable to find artifact for contract: ${name}`)

  // We return only one match for now
  return require(match[0])
}

export const getContractInterface = (
  name: string,
  version?: Versions,
  target: Targets = Targets.EVM,
): Interface => {
  const definition = getContractDefinition(name, version, target)
  return new ethers.utils.Interface(definition.abi)
}

export const getContractFactory = (
  name: string,
  signer?: Signer,
  version?: Versions,
  target: Targets = Targets.EVM,
): ContractFactory => {
  const definition = getContractDefinition(name, version, target)
  const contractInterface = getContractInterface(name, version, target)
  return new ContractFactory(contractInterface, definition.bytecode, signer)
}

export const deploy = async (
  factory: ContractFactory,
  name: string,
  payload: any[] = [],
): Promise<Contract> => {
  const contract = await factory.deploy(...payload)
  await contract.deployTransaction.wait()
  await assertDeployed(contract)
  console.log(`${contract.address} - '${name}' deployed with payload:`, payload)
  return contract
}

// To assert if contract is successfully deployed on OVM, we need to check
// if there is code for reported contract address. This check is necessary
// because Optimism Sequencer doesn't flag failed deployments as a failure.
export const assertDeployed = async (contract: Contract) => {
  await contract.deployed()

  const code = await contract.provider.getCode(contract.address)
  if (code && code.length > 2) return
  throw Error(`Error: Deployment unsuccessful - no code at ${contract.address}`)
}

const CONTRACT_PROXY = 'TransparentUpgradeableProxy'
const CONTRACT_PROXY_ADMIN = 'ProxyAdmin'

export const deployProxy = async (
  signer: Signer,
  target: Targets = Targets.EVM,
  logic: Contract,
  admin: string | undefined = undefined,
  data: Buffer = Buffer.from(''),
) => {
  console.log()
  if (!admin) {
    console.log('Admin not specified, deploying ProxyAdmin helper contract...')
    const proxyAdmin = await deploy(
      getContractFactory(CONTRACT_PROXY_ADMIN, signer, Versions.v0_7, target),
      CONTRACT_PROXY_ADMIN,
    )
    admin = proxyAdmin.address
  }

  const proxyFactory = getContractFactory(CONTRACT_PROXY, signer, Versions.v0_7, target)
  // Merge proxy + logic ABI
  const abi = uniqBy([...proxyFactory.interface.fragments, ...logic.interface.fragments], 'name')

  const payload = [logic.address, admin, data]
  return {
    admin,
    proxy: await deploy(
      new ContractFactory(abi, proxyFactory.bytecode, signer),
      CONTRACT_PROXY,
      payload,
    ),
  }
}

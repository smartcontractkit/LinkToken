import * as path from 'path'
import * as glob from 'glob'
import { ethers, ContractFactory, Signer } from 'ethers'
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
      `/contracts${version ? `/${version}` : ''}` +
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

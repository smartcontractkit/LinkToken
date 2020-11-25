import * as semver from 'semver'

import { globSync } from 'hardhat/internal/util/glob'
import { SolcConfig } from 'hardhat/types'

type Overrides = Record<string, SolcConfig>

export const generateOverrides = (
  pattern: string,
  options = {},
  compiler: SolcConfig,
): Overrides => {
  const overrides: Overrides = {}
  const files = globSync(pattern, options)
  console.log('Generating Hardhat overrides for: ', { files, compiler })
  files.forEach(f => (overrides[f] = compiler))
  return overrides
}

export const versionLabel = (version: string) => {
  if (!semver.valid(version)) throw Error(`Version is not valid: ${version}`)
  return `v${semver.major(version)}.${semver.minor(version)}`
}

const versionFilter = (version: string) => (c: SolcConfig) => c.version === version

export const requireCompiler = (version: string, compilers: SolcConfig[]) => {
  const choice = compilers.find(versionFilter(version))
  if (!choice) throw Error(`Compiler ${version} could not be found!`)
  return choice
}

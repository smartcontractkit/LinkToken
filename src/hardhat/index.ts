import * as glob from 'glob'
import { SolcConfig } from 'hardhat/types'

// Glob files matching the pattern and generate Hardhat overrides for them
export const generateOverrides = (
  pattern: string,
  options = {},
  compiler: SolcConfig,
): Record<string, SolcConfig> => {
  const overrides: Record<string, SolcConfig> = {}
  const files = glob.sync(pattern, options)
  console.log('Generating Hardhat overrides for: ')
  console.dir({ files, compiler }, { depth: null, colors: true })
  files.forEach((f) => (overrides[f] = compiler))
  return overrides
}

// Parse the --network flag from CLI arguments
export const argvNetwork = (defaultNetwork: string = 'hardhat') => {
  const { argv } = process
  const networkFlagIndex = argv.indexOf('--network')
  if (networkFlagIndex === -1) return defaultNetwork
  const networkValueIndex = networkFlagIndex + 1
  return argv.length === networkValueIndex ? defaultNetwork : argv[networkValueIndex]
}

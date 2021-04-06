import * as glob from 'glob'
import { SolcConfig } from 'hardhat/types'
import _yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

// Parse CLI arguments
export const yargs = _yargs(hideBin(process.argv))

// Load defult CLI arguments
export const { argv } = yargs.env(false).string('contracts').string('network')

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

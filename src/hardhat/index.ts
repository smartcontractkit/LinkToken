import * as glob from 'glob'
import { SolcConfig } from 'hardhat/types'

export const generateOverrides = (
  pattern: string,
  options = {},
  compiler: SolcConfig,
): Record<string, SolcConfig> => {
  const overrides: Record<string, SolcConfig> = {}
  const files = glob.sync(pattern, options)
  console.log('Generating Hardhat overrides for: ')
  console.dir({ files, compiler }, { depth: null, colors: true })
  files.forEach(f => (overrides[f] = compiler))
  return overrides
}

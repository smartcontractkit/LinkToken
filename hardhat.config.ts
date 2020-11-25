// hardhat.config.ts
import { HardhatUserConfig, SolcConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-waffle'
import 'hardhat-typechain'

import { requireCompiler, versionLabel } from './src/hardhat'

const DEFAULT_SOLC = '0.6.12'

const optimizer = {
  runs: 200,
  enabled: true,
}

const compilers: SolcConfig[] = [
  {
    version: '0.4.16',
    settings: { optimizer },
  },
  {
    version: '0.6.12',
    settings: { optimizer },
  },
  {
    version: '0.7.6',
    settings: { optimizer },
  },
]

const compiler = requireCompiler(process.env.SOLC || DEFAULT_SOLC, compilers)
const versionDir = versionLabel(compiler.version)

const config: HardhatUserConfig = {
  paths: {
    sources: `./contracts/${versionDir}`,
    cache: './build/cache',
    artifacts: './build/artifacts',
  },
  solidity: {
    compilers: Object.values(compilers),
  },
  typechain: {
    outDir: `build/types/${versionDir}`,
    target: 'ethers-v5',
  },
}

export default config

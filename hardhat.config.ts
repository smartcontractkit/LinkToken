// hardhat.config.ts
import { HardhatUserConfig, SolcConfig } from 'hardhat/types'
import { task } from 'hardhat/config'
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { hardhat, Networks, Versions } from './src'
// plugins
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import '@eth-optimism/hardhat-ovm'

const DEFAULT_NETWORK = Networks.HARDHAT
const DEFAULT_VERSION = Versions.v0_6

// Override compile task to add custom param
task(TASK_COMPILE)
  .addOptionalParam('contracts', 'The contracts version to compile.', DEFAULT_VERSION)
  .setAction(async (_args, _hre, runSuper) => runSuper(_args))

const _settings = (runs: number) => ({
  optimizer: {
    runs,
    enabled: true,
  },
  metadata: {
    // To support Go code generation from build artifacts
    // we need to remove the metadata from the compiled bytecode.
    bytecodeHash: 'none',
  },
})

const versions: Record<Versions, SolcConfig> = {
  [Versions.v0_4]: { version: '0.4.16', settings: _settings(200) },
  [Versions.v0_6]: { version: '0.6.12', settings: _settings(200) },
  [Versions.v0_7]: { version: '0.7.6', settings: _settings(1_000_000) },
}

// Require version exists
const versionLabel = hardhat.argv.contracts || DEFAULT_VERSION
const versionDir = `v${versionLabel}`
const compiler = versions[versionLabel as Versions]
if (!compiler) throw Error(`Compiler for ${versionLabel} could not be found!`)

// Setup networks
const networks: { [key: string]: any } = {
  [Networks.OPTIMISM]: {
    url: 'http://127.0.0.1:8545',
    ovm: true, // ensures contracts will be compiled to OVM target.
  },
}
const targetNetwork = hardhat.argv.network || DEFAULT_NETWORK
const typesDir = networks[targetNetwork]?.ovm ? `types-ovm` : 'types'

const config: HardhatUserConfig = {
  defaultNetwork: DEFAULT_NETWORK,
  networks,
  paths: {
    sources: `./contracts/${versionDir}`,
    cache: './build/cache',
    artifacts: './build/artifacts',
  },
  solidity: {
    compilers: Object.values(versions),
    overrides: {
      ...hardhat.generateOverrides(`./contracts/${versionDir}/**/*.sol`, {}, compiler),
    },
  },
  typechain: {
    outDir: `./build/${typesDir}/${versionDir}`,
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 5000,
  },
}

export default config

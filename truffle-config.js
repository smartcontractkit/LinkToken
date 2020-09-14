const HDWalletProvider = require('@truffle/hdwallet-provider')

const MNEMONIC =
  process.env.MNEMONIC ||
  'clock radar mass judge dismiss just intact mind resemble fringe diary casino'
const INFURA_API_KEY = process.env.INFURA_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const walletProvider = (provider) => new HDWalletProvider(MNEMONIC, provider)

module.exports = {
  //$ truffle test --network <network-name>
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // match any network
      gas: 7000000,
      skipDryRun: true,
    },
    goerli: {
      provider: () => walletProvider(`https://goerli.infura.io/v3/${INFURA_API_KEY}`),
      network_id: 5,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
    maticMumbai: {
      provider: () => walletProvider('https://rpc-mumbai.matic.today'),
      network_id: 80001,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
    mainnet: {
      provider: () => walletProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`),
      network_id: 1,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 21,
      showTimeSpent: true,
    },
  },

  // Configure contracts location
  contracts_directory: './contracts/v0.6/',

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.6', // Fetch exact version from solc-bin (default: truffle's version)
      parser: 'solcjs',
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 1337,
        },
        evmVersion: 'istanbul',
      },
    },
  },

  verify: {
    preamble: 'LINK\nVersion: 0.1.0',
  },

  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
}

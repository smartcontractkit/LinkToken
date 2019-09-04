module.exports = {
  compilers: {
    solc: {
      version: '0.4.11'
    }
  },
  networks: {
    development: {
      host: "localhost",
      port: 9656,
      network_id: "*" // Match any network id
    }
  }
};

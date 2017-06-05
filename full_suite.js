BigNumber = require('bignumber.js');
Truffle = require('truffle');
TestRPC = require('ethereumjs-testrpc');
moment = require('moment');
Web3 = require('web3');

var server = TestRPC.server({
  accounts: [
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000000'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000001'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000002'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000003'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000004'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000005'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000006'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000007'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000008'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf000000000000000000000000000000000000000000000000000000000000009'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf00000000000000000000000000000000000000000000000000000000000000a'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf00000000000000000000000000000000000000000000000000000000000000b'},
    {balance: '0xffffffffffffffffffffffffffffffff', secretKey: '0xf00000000000000000000000000000000000000000000000000000000000000c'},
  ],
  // gasLimit: 100000000000,
  logger: { log: () => {} }
  // logger: console
});
global.provider = server.provider;

var config = Truffle.config.detect({
  test_files: [
    'test/TokenSale_spec.js',
    'test/SmartOracle_spec.js',
  ],
  provider: provider
})

server.listen(6323, () => {
  Truffle.test.run(config, process.exit);
});

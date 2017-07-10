BigNumber = require('bignumber.js');
TestRPC = require('ethereumjs-testrpc');
moment = require('moment');
Web3 = require('web3');

(() => {
  eth = web3.eth;

  before(async function () {
    accounts = await eth.accounts;
    Accounts = accounts.slice(1);
  });

  Eth = function sendEth(method, params) {
    params = params || [];

    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: method,
        params: params || [],
        id: new Date().getTime()
      }, function sendEthResponse(error, response) {
        if (error) {
          reject(error);
        } else {
          resolve(response.result);
        };
      }, () => {}, () => {});
    });
  };

  emptyAddress = '0x0000000000000000000000000000000000000000';

  sealBlock = async function sealBlock() {
    return Eth('evm_mine');
  };

  sendTransaction = async function sendTransaction(params) {
    return await eth.sendTransaction(params);
  }

  getBalance = async function getBalance(account) {
    return bigNum(await eth.getBalance(account));
  }

  bigNum = function bigNum(number) {
    return new BigNumber(number);
  }

  toWei = function toWei(number) {
    return bigNum(web3.toWei(number));
  }

  intToHex = function intToHex(number) {
    return '0x' + bigNum(number).toString(16);
  }

  unixTime = function unixTime(time) {
    return moment(time).unix();
  }

  seconds = function seconds(number) {
    return number;
  };

  minutes = function minutes(number) {
    return number * 60;
  };

  hours = function hours(number) {
    return number * minutes(60);
  };

  days = function days(number) {
    return number * hours(24);
  };

  getLatestBlock = async function getLatestBlock() {
    return await eth.getBlock('latest', false);
  };

  getLatestTimestamp = async function getLatestTimestamp () {
    let latestBlock = await getLatestBlock()
    return web3.toDecimal(latestBlock.timestamp);
  };

  fastForwardTo = async function fastForwardTo(target) {
    let now = await getLatestTimestamp();
    assert.isAbove(target, now, "Cannot fast forward to the past");
    let difference = target - now;
    await Eth("evm_increaseTime", [difference]);
    await sealBlock();
  };

  getEvents = function getEvents(contract) {
    return new Promise((resolve, reject) => {
      contract.allEvents().get((error, events) => {
        if (error) {
          reject(error);
        } else {
          resolve(events);
        };
      });
    });
  };

  eventsOfType = function eventsOfType(events, type) {
    let filteredEvents = [];
    for (event of events) {
      if (event.event === type) filteredEvents.push(event);
    }
    return filteredEvents;
  };

  getEventsOfType = async function getEventsOfType(contract, type) {
    return eventsOfType(await getEvents(contract), type);
  };

  getLatestEvent = async function getLatestEvent(contract) {
    let events = await getEvents(contract);
    return events[events.length - 1];
  };

  assertActionThrows = function assertActionThrows(action) {
    return Promise.resolve().then(action)
      .catch(error => {
        assert(error, "Expected an error to be raised");
        assert(error.message, "Expected an error to be raised");
        return error.message;
      })
      .then(errorMessage => {
        assert(errorMessage, "Expected an error to be raised");
        assert.include(errorMessage, "invalid opcode", 'expected error message to include "invalid JUMP"');
        // see https://github.com/ethereumjs/testrpc/issues/39
        // for why the "invalid JUMP" is the throw related error when using TestRPC
      })
  };

})();

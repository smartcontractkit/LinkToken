(() => {
  before(() => {
    return Eth('eth_accounts')
      .then(accounts => {
        Accounts = accounts.slice(1);
      });
  });

  global.web3 = new Web3();
  global.web3.setProvider(provider);
  global.eth = web3.eth;

  Eth = function sendEth(method, params) {
    params = params || [];

    return new Promise((resolve, reject) => {
      provider.sendAsync({
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

  sealBlock = function sealBlock() {
    return Eth('evm_mine');
  };

  sendTransaction = function sendTransaction(params) {
    return Eth('eth_sendTransaction', [params]);
  }

  getBalance = function getBalance(account) {
    return Eth('eth_getBalance', [account])
      .then(response => bigNum(response));
  }

  bigNum = function bigNum(number) {
    return new BigNumber(number);
  }

  toWei = function toWei(number) {
    return parseInt(web3.toWei(number));
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

  getLatestBlock = function getLatestBlock() {
    return Eth('eth_getBlockByNumber', ['latest', false])
  };

  getLatestTimestamp = function getLatestTimestamp () {
    return getLatestBlock().then(block => web3.toDecimal(block.timestamp));
  };

  fastForwardTo = function fastForwardTo(target) {
    return getLatestTimestamp().then(now => {
      assert.isAbove(target, now, "Cannot fast forward to the past");
      let difference = target - now;
      return Eth("evm_increaseTime", [difference])
        .then(sealBlock);
    });
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

  getEventsOfType = function getEventsOfType(contract, type) {
    return getEvents(contract)
      .then(events => eventsOfType(events, type));
  };

  getLatestEvent = function getLatestEvent(contract) {
    return getEvents(contract)
      .then(events => events[events.length - 1]);
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
        assert.include(errorMessage, "invalid JUMP", 'expected error message to include "invalid JUMP"');
        // see https://github.com/ethereumjs/testrpc/issues/39
        // for why the "invalid JUMP" is the throw related error when using TestRPC
      })
  };

})();

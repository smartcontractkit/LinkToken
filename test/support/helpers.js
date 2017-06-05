(() => {
  before(() => {
    return Eth('eth_accounts')
      .then(accounts => {
        Accounts = accounts.slice(1);
      });
  });

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

})();

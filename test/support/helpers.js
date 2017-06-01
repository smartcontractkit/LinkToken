(() => {
  eth = web3.eth;

  before(() => {
    Accounts = eth.accounts.slice(1);
  });
})();

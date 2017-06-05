require('./support/helpers.js');

contract('TokenSale', () => {
  let limit, owner, purchaser, recipient, sale, starttime;

  beforeEach(() => {
    owner = Accounts[0];
    recipient = Accounts[1];
    purchaser = Accounts[2];
    limit = 1000000;

    return getLatestTimestamp()
      .then(timestamp => {
        startTime = timestamp + 1000;
        return TokenSale.new(recipient, limit, startTime, {from: owner})
      })
      .then(response => sale = response)
  });

  describe("initialization", () => {
    it("sets the initial limit of the token sale", () => {
      return sale.fundingLimit.call().then(fundingLimit => {
        assert.equal(limit.toString(), fundingLimit.toString());
      });
    });

    it("sets the recipient of the funds", () => {
      return sale.recipient.call().then(fundingRecipient => {
        assert.equal(recipient, fundingRecipient);
      });
    });

    it("sets the start date of the contract", () => {
      return sale.startTime.call().then(fundingStart => {
        assert.equal(startTime.toString(), fundingStart.toString());
      });
    });

    it("sets the end of phase one as a week after the start time", () => {
      return sale.phaseOneEnd.call().then(phaseTwo => {
        let expected = startTime + days(7);
        assert.equal(expected.toString(), phaseTwo.toString());
      });
    });

    it("sets the end of phase two as two weeks after the start time", () => {
      return sale.phaseTwoEnd.call().then(phaseThree => {
        let expected = startTime + days(14);
        assert.equal(expected.toString(), phaseThree.toString());
      });
    });

    it("sets the end of phase three as four weeks after the start time", () => {
      return sale.phaseThreeEnd.call().then(fundingEnd => {
        let expected = startTime + days(28);
        assert.equal(expected.toString(), fundingEnd.toString());
      });
    });
  });

  describe("fallback function", () => {
    let value = 1234509876;

    it("forwards any value to the recipient", () => {
      let params = {to: sale.address, from: purchaser, value: value};
      let originalBalance;

      return getBalance(recipient)
        .then(response => {
          originalBalance = response;
          return sendTransaction(params)
        })
        .then(response => getBalance(recipient))
        .then(newBalance => {
          assert.equal(newBalance.toString(), originalBalance.add(value).toString());
        });
    });

    it("emits an event log when the payment is received", () => {
      let params = {to: sale.address, from: purchaser, value: value};

      return getEvents(sale)
        .then(events => {
          assert.equal(events.length, 0);
          return sendTransaction(params);
        })
        .then(() => getEvents(sale))
        .then(events => {
          assert.equal(events.length, 1);
          let event = events[0];
          assert.equal(event.event, 'Purchase');
          assert.equal(event.args.purchaser, purchaser);
          assert.equal(event.args.amount, value);
        });
    });
  });
});

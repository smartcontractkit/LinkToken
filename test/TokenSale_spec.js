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
      return sale.endTime.call().then(fundingEnd => {
        let expected = startTime + days(28);
        assert.equal(expected.toString(), fundingEnd.toString());
      });
    });
  });

  describe("fallback function", () => {
    let originalBalance, params, ratio, value;

    beforeEach(() => {
      ratio = 1;
      value = toWei(ratio);
      params = {to: sale.address, from: purchaser, value: value};
    });

    context("during the funding period", () => {
      beforeEach(() => {
        return fastForwardTo(startTime)
          .then(getLatestTimestamp)
          .then(timestamp => assert.isAtLeast(timestamp, startTime));
      });

      it("forwards any value to the recipient", () => {
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
            assert.equal(event.args.paid.toString(), value.toString());
            assert.equal(event.args.received.toString(), '1000');
          });
      });
    });

    context("when it is during the first phase", () => {
      beforeEach(() => {
        return getLatestTimestamp()
          .then(timestamp => assert.isBelow(timestamp, startTime));
      });

      it("throws an error", () => {
        let params = {to: sale.address, from: purchaser, value: value};

        return assertActionThrows(() => {
          return sendTransaction(params);
        });
      });
    });

    context("when it is during the first phase", () => {
      beforeEach(() => {
        return fastForwardTo(startTime)
          .then(getLatestTimestamp)
          .then(timestamp => assert.isAtLeast(timestamp, startTime));
      });

      it("counts 1,000,000 tokens as released per Ether", () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = value;

        return sendTransaction(params)
          .then(() => getEvents(sale))
          .then(events => {
            assert.equal(events.length, 1);
            let event = events[0];
            assert.equal(event.args.received.toString(), (1000 * ratio).toString());
          });
      });
    });

    context("when it is during the second phase", () => {
      beforeEach(() => {
        let phaseTwo = startTime + days(7);
        return fastForwardTo(phaseTwo + 1)
          .then(getLatestTimestamp)
          .then(timestamp => assert.isAtLeast(timestamp, phaseTwo));
      });

      it("counts 750,000 tokens as released per Ether", () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = value;

        return sendTransaction(params)
          .then(() => getEvents(sale))
          .then(events => {
            assert.equal(events.length, 1);
            let event = events[0];
            assert.equal(event.args.received.toString(), parseInt(750 * ratio).toString());
          });
      });
    });

    context("when it is during the third phase", () => {
      beforeEach(() => {
        let phaseThree = startTime + days(14);
        return fastForwardTo(phaseThree + 1)
          .then(getLatestTimestamp)
          .then(timestamp => assert.isAtLeast(timestamp, phaseThree));
      });

      it("counts 500,000 tokens as released per Ether", () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = value;

        return sendTransaction(params)
          .then(() => getEvents(sale))
          .then(events => {
            assert.equal(events.length, 1);
            let event = events[0];
            assert.equal(event.args.received.toString(), (500 * ratio).toString());
          });
      });
    });

    context("when it is during the third phase", () => {
      beforeEach(() => {
        let endTime = startTime + days(28);
        return fastForwardTo(endTime + 1)
          .then(getLatestTimestamp)
          .then(timestamp => assert.isAtLeast(timestamp, endTime));
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sendTransaction(params);
        });
      });
    });
  });
});

require('./support/helpers.js')

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let limit, owner, purchaser, recipient, sale, startTime;

  beforeEach(async () => {
    owner = Accounts[0];
    recipient = Accounts[1];
    purchaser = Accounts[2];
    limit = toWei(1000);
    startTime = await getLatestTimestamp() + 1000;
    sale = await TokenSale.new(recipient, limit, startTime, {from: owner});
  });

  describe("initialization", () => {
    it("sets the initial limit of the token sale", async () => {
      let fundingLimit = await sale.fundingLimit.call();

      assert.equal(limit.toString(), fundingLimit.toString());
    });

    it("sets the recipient of the funds", async () => {
      let fundingRecipient = await sale.recipient.call();

      assert.equal(recipient, fundingRecipient);
    });

    it("sets the start date of the contract", async () => {
      let fundingStart = await sale.startTime.call();

      assert.equal(startTime.toString(), fundingStart.toString());
    });

    it("sets the end of phase one as a week after the start time", async () => {
      let phaseTwo = await sale.phaseOneEnd.call();
      let expected = startTime + days(7);

      assert.equal(expected.toString(), phaseTwo.toString());
    });

    it("sets the end of phase two as two weeks after the start time", async () => {
      let phaseThree = await sale.phaseTwoEnd.call();
      let expected = startTime + days(14);

      assert.equal(expected.toString(), phaseThree.toString());
    });

    it("sets the end of phase three as four weeks after the start time", async () => {
      let fundingEnd = await sale.endTime.call();
      let expected = startTime + days(28);

      assert.equal(expected.toString(), fundingEnd.toString());
    });

    it("saves the owner of the contract", async () => {
      let saleOwner = await sale.owner.call();

      assert.equal(saleOwner, owner);
    });

    it("deploys a LinkToken contract", async () => {
      let linkAddress = await sale.token.call();
      let link = LinkToken.at(linkAddress);
      let saleBalance = await link.balanceOf.call(sale.address);

      assert.equal(saleBalance.toString(), bigNum(10**18).toString());
    });
  });

  describe("fallback function", () => {
    let link, linkAddress, originalBalance, params, ratio, value;

    beforeEach(async () => {
      ratio = 1;
      value = toWei(ratio);
      linkAddress = await sale.token.call();
      link = LinkToken.at(linkAddress);
      params = {to: sale.address, from: purchaser, value: parseInt(value)};
    });

    context("during the funding period", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
        let timestamp = await getLatestTimestamp();

        assert.isAtLeast(timestamp, startTime);
      });

      it("forwards any value to the recipient", async () => {
        let originalBalance = await getBalance(recipient);
        let response = await sendTransaction(params);
        let newBalance = await getBalance(recipient);

        assert.equal(newBalance.toString(), originalBalance.add(value).toString());
      });

      it("emits an event log when the payment is received", async () => {
        let events = await getEvents(link)
        assert.equal(events.length, 0);
        await sendTransaction(params);

        let events2 = await getEvents(link);
        assert.equal(events2.length, 1);
        let event = events2[0];
        assert.equal(event.event, 'Transfer');
        assert.equal(event.args.from, sale.address);
        assert.equal(event.args.to, purchaser);
        assert.equal(event.args.value.toString(), '1000');
      });

      context("if the funding limit is exceeded", () => {
        beforeEach(() => {
          params['value'] = limit.toNumber() * 2;
        });

        it("throws an error", () => {
          return assertActionThrows(() => {
            return sendTransaction(params);
          });
        });
      });
    });

    context("when it is before the first phase", () => {
      beforeEach(async () => {
        let timestamp = await getLatestTimestamp();

        assert.isBelow(timestamp, startTime);
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sendTransaction(params);
        });
      });
    });

    context("when it is during the first phase", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, startTime);
      });

      it("counts 1,000 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = parseInt(value);

        await sendTransaction(params);

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), (1000 * ratio).toString());
      });
    });

    context("when it is during the second phase", () => {
      beforeEach(async () => {
        let phaseTwo = startTime + days(7);
        await fastForwardTo(phaseTwo + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phaseTwo);
      });

      it("counts 750 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = parseInt(value);

        await sendTransaction(params)

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), parseInt(750 * ratio).toString());
      });
    });

    context("when it is during the third phase", () => {
      beforeEach(async () => {
        let phaseThree = startTime + days(14);
        await fastForwardTo(phaseThree + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phaseThree);
      });

      it("counts 500 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = parseInt(value);

        await sendTransaction(params)

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), parseInt(500 * ratio).toString());
      });
    });

    context("when it is during the third phase", () => {
      beforeEach(async () => {
        let endTime = startTime + days(28);
        await fastForwardTo(endTime + 1)

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, endTime);
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sendTransaction(params);
        });
      });
    });
  });
});

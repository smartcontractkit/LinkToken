require('./support/helpers.js')

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let endTime, limit, link, owner, prePurchased, purchaser, sale, startTime;

  beforeEach(async () => {
    owner = Accounts[0];
    purchaser = Accounts[1];
    limit = toWei(0.2);
    prePurchased = toWei(0.01);
    startTime = await getLatestTimestamp() + 1000;
    endTime = startTime + days(28);
    sale = await TokenSale.new(limit, prePurchased, startTime, {from: owner});
    let linkAddress = await sale.token.call();
    link = LinkToken.at(linkAddress);
  });

  describe("initialization", () => {
    it("sets the initial limit of the token sale", async () => {
      let tokenLimit = await sale.limit.call();

      assert.equal(limit.toString(), tokenLimit.toString());
    });

    it("sets the the creator as the owner", async () => {
      let saleOwner = await sale.owner.call();

      assert.equal(owner, saleOwner);
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
      let saleBalance = await link.balanceOf.call(sale.address);

      assert.equal(saleBalance.toString(), bigNum(10**18).toString());
    });

    context("if the token sale limit is set too high", () => {
      it("throws an error", () => {
        return assertActionThrows(() => {
          let newLimit = toWei(1).add(1);
          return TokenSale.new(newLimit, prePurchased, startTime, {from: owner});
        });
      });
    });
  });

  describe("fallback function", () => {
    let originalBalance, params, ratio, value;

    beforeEach(async () => {
      ratio = 1;
      value = toWei(ratio);
      params = {to: sale.address, from: purchaser, value: intToHex(value)};
    });

    context("during the funding period", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
        let timestamp = await getLatestTimestamp();

        assert.isAtLeast(timestamp, startTime);
      });

      it("forwards any value to the owner", async () => {
        let originalBalance = await getBalance(owner);
        let response = await sendTransaction(params);
        let newBalance = await getBalance(owner);

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
        assert.equal(event.args.value.toString(), '1000000000000');
      });

      context("if the funding limit is exceeded", () => {
        beforeEach(() => {
          params['value'] = limit.minus(prePurchased).add(1).times(10**15);
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
        params['value'] = intToHex(value);

        await sendTransaction(params);

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), (1000000000000 * ratio).toString());
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
        params['value'] = intToHex(value);

        await sendTransaction(params)

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), parseInt(750000000000 * ratio).toString());
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
        params['value'] = intToHex(value);

        await sendTransaction(params)

        let events = await getEvents(link);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.value.toString(), parseInt(500000000000 * ratio).toString());
      });
    });

    context("when it is after the third phase", () => {
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

  describe("#closeOut", () => {
    context("when it is called by someone other than the owner", () => {
      it("throws an error", () => {
        return assertActionThrows(() => {
          return sale.closeOut({from: purchaser});
        });
      });
    });

    context("when it is called by the owner", () => {
      context("before the sale starts", () => {
        it("throws an error", () => {
          return assertActionThrows(() => {
            return sale.closeOut({from: owner});
          });
        });
      });

      context("during the sale period", () => {
        beforeEach(async () => {
          await fastForwardTo(startTime);
        });

        context("if all tokens have NOT been sold", () => {
          it("throws an error", () => {
            return assertActionThrows(() => {
              return sale.closeOut({from: owner});
            });
          });
        });

        context("if all tokens have been sold", () => {
          beforeEach(async () => {
            await sendTransaction({
              from: purchaser,
              to: sale.address,
              value: intToHex(limit.minus(prePurchased))
            });
          });

          it("transfers the remaining tokens to the owner", async () => {
            let ownerPre = await link.balanceOf.call(owner);
            let salePre = await link.balanceOf.call(sale.address);

            await sale.closeOut({from: owner});

            let ownerPost = await link.balanceOf.call(owner);
            let salePost = await link.balanceOf.call(sale.address);

            assert.equal(ownerPre.toString(), '0');
            assert.equal(ownerPost.toString(), salePre.toString());
            assert.equal(salePost.toString(), '0');
          });
        });

        context("if the sale time has ended", () => {
          beforeEach(async () => {
            await fastForwardTo(endTime + 1);
          });

          it("transfers the remaining tokens to the owner", async () => {
            let ownerPre = await link.balanceOf.call(owner);
            let salePre = await link.balanceOf.call(sale.address);

            await sale.closeOut({from: owner});

            let ownerPost = await link.balanceOf.call(owner);
            let salePost = await link.balanceOf.call(sale.address);

            assert.equal(ownerPre.toString(), '0');
            assert.equal(ownerPost.toString(), salePre.toString());
            assert.equal(salePost.toString(), '0');
          });
        });
      });
    });
  });
});

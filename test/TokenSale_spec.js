require('./support/helpers.js')

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let LinkToken = artifacts.require("./contracts/LinkToken.sol");
  let distributionUpdater, endTime, limit, link, owner, prePurchased, purchaser, sale, startTime;

  beforeEach(async () => {
    deployer = Accounts[0];
    purchaser = Accounts[1];
    owner = Accounts[2];
    distributionUpdater = Accounts[3];
    limit = tokens(10**9);
    prePurchased = tokens(10**8);
    startTime = await getLatestTimestamp() + 1000;
    endTime = startTime + days(28);
    sale = await TokenSale.new(limit, prePurchased, startTime, owner, distributionUpdater, {from: deployer});
    let linkAddress = await sale.token.call();
    link = LinkToken.at(linkAddress);
  });

  it("has a limited public ABI", () => {
    let expectedABI = [
      //public attributes
      'distributed',
      'distributionUpdater',
      'endTime',
      'limit',
      'owner',
      'phase1End',
      'phase2End',
      'phase3End',
      'phase4End',
      'recipient',
      'startTime',
      'token',
      //public functions
      'closeOut',
      'completed',
      'finalize',
      'purchase',
      'transferOwnership',
      'updateDistributed',
    ];

    checkPublicABI(TokenSale, expectedABI);
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

    it("sets the end of phase one as one day after the start time", async () => {
      let phase1 = await sale.phase1End.call();
      let expected = days(1);

      assert.equal(expected.toString(), phase1.toString());
    });

    it("sets the end of phase two as one week after the start time", async () => {
      let phase2 = await sale.phase2End.call();
      let expected = days(7);

      assert.equal(expected.toString(), phase2.toString());
    });

    it("sets the end of phase three as two weeks after the start time", async () => {
      let phase3 = await sale.phase3End.call();
      let expected = days(14);

      assert.equal(expected.toString(), phase3.toString());
    });

    it("sets the end of phase four as three weeks after the start time", async () => {
      let phase4 = await sale.phase4End.call();
      let expected = days(21);

      assert.equal(expected.toString(), phase4.toString());
    });

    it("sets the end of phase five as four weeks after the start time", async () => {
      let fundingEnd = await sale.endTime.call();
      let expected = days(28);

      assert.equal(expected.toString(), fundingEnd.toString());
    });

    it("saves the owner of the contract", async () => {
      let saleOwner = await sale.owner.call();

      assert.equal(saleOwner, owner);
    });

    it("saves the distribution updater of the contract", async () => {
      let saleUpdater = await sale.distributionUpdater.call();

      assert.equal(saleUpdater, distributionUpdater);
    });

    it("deploys a LinkToken contract", async () => {
      let saleBalance = await link.balanceOf.call(sale.address);

      assert.equal(saleBalance.toString(), bigNum(10**18).toString());
    });

    context("if the token sale limit is set too high", () => {
      it("throws an error", () => {
        return assertActionThrows(() => {
          let newLimit = toWei(1).add(1);
          return TokenSale.new(newLimit, prePurchased, startTime, owner, distributionUpdater, {from: deployer});
        });
      });
    });
  });

  describe("the fallback function", () => {
    let originalBalance, params, value;

    beforeEach(async () => {
      value = toWei(1);
      await fastForwardTo(startTime);
      let timestamp = await getLatestTimestamp();
      assert.isAtLeast(timestamp, startTime);
      params = {from: purchaser, to: sale.address, value: intToHex(value)};
    });

    it("calls the purchase function with the message sender", async () => {
      let originalBalance = await getBalance(owner);
      await sendTransaction(params);
      let newBalance = await getBalance(owner);
      assert.equal(newBalance.toString(), originalBalance.add(value).toString());

      let tokenBalance = await link.balanceOf.call(purchaser)
      assert.equal(tokenBalance.toString(), '2000000000000');
    });
  });

  describe("#purchase", () => {
    let originalBalance, params, ratio, value;

    beforeEach(async () => {
      ratio = 1;
      value = toWei(ratio);
      params = {from: purchaser, value: intToHex(value)};
    });

    context("during the funding period", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
        let timestamp = await getLatestTimestamp();

        assert.isAtLeast(timestamp, startTime);
      });

      it("forwards any value to the owner", async () => {
        let originalBalance = await getBalance(owner);
        await sale.purchase(purchaser, params);
        let newBalance = await getBalance(owner);

        assert.equal(newBalance.toString(), originalBalance.add(value).toString());
      });

      it("emits an event log when the payment is received", async () => {
        let events = await getEvents(link)
        assert.equal(events.length, 0);
        await sale.purchase(purchaser, params);

        let events2 = await getEvents(link);
        assert.equal(events2.length, 1);
        let event = events2[0];
        assert.equal(hexToAddress(event.topics[0]), logTopic('Transfer(address,address,uint256)'));
        assert.equal(hexToAddress(event.topics[1]), sale.address);
        assert.equal(hexToAddress(event.topics[2]), purchaser);
        assert.equal(hexToInt(event.data).toString(), bigNum(2000000000000).toString());
      });

      context("if the funding limit is exceeded", () => {
        beforeEach(() => {
          params['value'] = tokens(limit.minus(prePurchased)).add(1).times(10**6 * 0.5);
        });

        it("throws an error", () => {
          return assertActionThrows(() => {
            return sale.purchase(purchaser, params);
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
          return sale.purchase(purchaser, params);
        });
      });
    });

    context("when it is during the first day", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, startTime);
      });

      it("counts 2,000 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = intToHex(value);

        await sale.purchase(purchaser, params);

        let tokenBalance = await link.balanceOf.call(purchaser)
        let expectedBalance = parseInt(2000000000000 * ratio).toString();
        assert.equal(tokenBalance.toString(), expectedBalance);
      });
    });

    context("when it is during the second phase(first week)", () => {
      beforeEach(async () => {
        let phase2 = startTime + days(1);
        await fastForwardTo(phase2 + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phase2);
      });

      it("counts 1,750 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = intToHex(value);

        await sale.purchase(purchaser, params);

        let tokenBalance = await link.balanceOf.call(purchaser)
        let expectedBalance = parseInt(1750000000000 * ratio).toString()
        assert.equal(tokenBalance.toString(), expectedBalance);
      });
    });

    context("when it is during the third phase(second week)", () => {
      beforeEach(async () => {
        let phase3 = startTime + days(7);
        await fastForwardTo(phase3 + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phase3);
      });

      it("counts 1,650 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = intToHex(value);

        await sale.purchase(purchaser, params);

        let tokenBalance = await link.balanceOf.call(purchaser)
        let expectedBalance = parseInt(1650000000000 * ratio).toString();
        assert.equal(tokenBalance.toString(), expectedBalance);
      });
    });

    context("when it is during the fourth phase(third week)", () => {
      beforeEach(async () => {
        let phase4 = startTime + days(14);
        await fastForwardTo(phase4 + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phase4);
      });

      it("counts 1,550 tokens as released per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = intToHex(value);

        await sale.purchase(purchaser, params);

        let tokenBalance = await link.balanceOf.call(purchaser)
        let expectedBalance = parseInt(1550000000000 * ratio).toString();
        assert.equal(tokenBalance.toString(), expectedBalance);
      });
    });

    context("when it is during the fifth phase(fourth week)", () => {
      beforeEach(async () => {
        let phase5 = startTime + days(21);
        await fastForwardTo(phase5 + 1);

        let timestamp = await getLatestTimestamp();
        assert.isAtLeast(timestamp, phase5);
      });

      it("releases 1,450 tokens per Ether", async () => {
        ratio = 1.1;
        value = toWei(ratio);
        params['value'] = intToHex(value);

        await sale.purchase(purchaser, params);

        let tokenBalance = await link.balanceOf.call(purchaser)
        let expectedBalance = parseInt(1450000000000 * ratio).toString();
        assert.equal(tokenBalance.toString(), expectedBalance);
      });
    });

    context("when it is after the final phase", () => {
      beforeEach(async () => {
        let endTime = startTime + days(28);
        await fastForwardTo(endTime + 1)
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sale.purchase(purchaser, params);
        });
      });
    });

    context("when it is during the sale period but the contract has been finalized by the owner", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
        await sale.finalize({from: owner});
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sale.purchase(purchaser, params);
        });
      });
    });
  });

  describe("#closeOut", () => {
    context("when it is called by someone other than the owner", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
      });

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
            await sale.purchase(purchaser, {
              from: purchaser,
              value: intToHex(limit.minus(prePurchased).times(10**6 * 0.5))
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

  describe("#completed", () => {
    context("before the sale starts", () => {
      it("returns false", async () => {
        assert(!await sale.completed.call());
      });
    });

    context("during the sale period", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
      });


      context("if all tokens have NOT been sold", () => {
        it("returns false", async () => {
          assert(!await sale.completed.call());
        });
      });

      context("if all tokens have been sold", () => {
        beforeEach(async () => {
          await sale.purchase(purchaser, {
            from: purchaser,
            value: intToHex(limit.minus(prePurchased).times(10**6 * 0.5))
          });
        });

        it("returns true", async () => {
          assert(await sale.completed.call());
        });
      });

      context("if the sale time has ended", () => {
        beforeEach(async () => {
          await fastForwardTo(endTime + 1);
        });

        it("returns true", async () => {
          assert(await sale.completed.call());
        });
      });
    });
  });

  describe("#finalize", () => {
    context("when it is called by someone other than the owner", () => {
      beforeEach(async () => {
        await fastForwardTo(startTime);
      });

      it("throws an error", () => {
        return assertActionThrows(() => {
          return sale.finalize({from: purchaser});
        });
      });
    });

    context("when it is called by the owner", () => {
      context("before the sale starts", () => {
        it("throws an error", () => {
          return assertActionThrows(() => {
            return sale.finalize({from: owner});
          });
        });
      });

      context("during the sale period", () => {
        beforeEach(async () => {
          await fastForwardTo(startTime);
        });

        it("changes the contract to completed", async () => {
          assert(!await sale.completed.call());

          await sale.finalize({from: owner});

          assert(await sale.completed.call());
        });
      });
    });

    context("when it is after the fourth phase", () => {
      beforeEach(async () => {
        let endTime = startTime + days(28);
        await fastForwardTo(endTime + 1)
      });

      it("does not change the completed status", async () => {
        assert(await sale.completed.call());

        await sale.finalize({from: owner});

        assert(await sale.completed.call());
      });
    });
  });

  describe("#updateDistributed", () => {
    let updatedAmount = 1000000000;

    context("when it is invoked by someone other than the trusted updater", () => {
      it("throws an error", async () => {
        await assertActionThrows(async () => {
          await sale.updateDistributed(updatedAmount, {from: owner});
        });
      });
    });

    context("when it is invoked by the trusted updater", () => {
      it("updates the distributed amount", async () => {
        let originalDistribution = await sale.distributed.call();

        await sale.updateDistributed(updatedAmount, {from: distributionUpdater});

        let laterDistribution = await sale.distributed.call();

        assert.equal(originalDistribution.add(updatedAmount).toString(), laterDistribution.toString());
      });
    });
  });
});

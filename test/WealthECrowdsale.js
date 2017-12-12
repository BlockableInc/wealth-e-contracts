import { advanceBlock } from './vendor/zeppelin-solidity/advanceToBlock';
import { increaseTime, increaseTimeTo, duration } from './vendor/zeppelin-solidity/increaseTime';
import latestTime from './vendor/zeppelin-solidity/latestTime';
import { assertError } from './utils';

const WealthECrowdsale = artifacts.require('./WealthECrowdsale.sol');
const WealthE = artifacts.require("./WealthE.sol");

const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545/');

const { toWei, fromWei } = web3._extend.utils;

const BigNumber = require('bignumber.js');


// Date Utils.
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }


const million = 1000000;
let token;
let owner;
let multiSig;
let crowdsale;
let batchAddresses;
let batchAmounts;
const startTime = new Date('Wed, 10 Jan 2018 00:00:00 GMT').getUnixTime();
const publicStartTime = new Date('Sat, 10 Feb 2018 00:00:00 GMT').getUnixTime();;
const endTime = new Date('Sat, 31 Mar 2018 00:00:00 GMT').getUnixTime();

contract('WealthECrowdsale', (accounts) => {

    before(async () => {

        owner = accounts[0];
        multiSig = accounts[7];
        batchAddresses = accounts.slice(10, 15);
        // All amounts converted to wei with the exception of index 0.
        // The purpse of this is to use 1 as a flag to defer to the
        // defaultWhitelistCap.
        batchAmounts = [1, 20, 30, 40, 50].map(x => x === 1 ? 1 : toWei(x));
        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Advance to the next block to correctly read time in
        // the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });


    it('should have correct dates, grains, and allocations set', async () => {

        const start = await crowdsale.START_TIME();
        const end = await crowdsale.END_TIME();
        const grains = await crowdsale.GRAINS();
        const totalSaleTokens = await crowdsale.TOTAL_SALE_TOKENS();
        const minContribution = await crowdsale.MINIMUM_CONTRIBUTION();

        assert.strictEqual(start.toNumber(), startTime);
        assert.strictEqual(end.toNumber(), endTime);
        assert.strictEqual(parseInt(fromWei(grains)), 1);
        assert.strictEqual(parseInt(fromWei(totalSaleTokens)), 100 * million);
        assert.strictEqual(parseInt(fromWei(minContribution)), 151);
    });


    /*----------- MultiSig Wallet Setter -----------*/


    it('should fail to set multisig address when invalid address is used', async () => {
        try {
            await crowdsale.setMultiSig(0x0, { from: owner });
        } catch (error) {
            assertError(error);
        }

        const multiSigIsSet = await crowdsale.multiSigSet();
        assert.isFalse(multiSigIsSet);
    });


    it('should fail to set multisig address when called by an address other than owner', async () => {
        try {
            await crowdsale.setMultiSig(multiSig, { from: accounts[3] });
        } catch (error) {
            assertError(error);
        }

        const multiSigIsSet = await crowdsale.multiSigSet();
        assert.isFalse(multiSigIsSet);
    });


    it('should fail to set multisig address when multisig already set', async () => {

        await crowdsale.setMultiSig(multiSig, { from: owner });

        const multiSigIsSet = await crowdsale.multiSigSet();
        assert.isTrue(multiSigIsSet);

        let multiSigAddress = await crowdsale.multiSig();
        assert.strictEqual(multiSigAddress, multiSig)

        try {
            await crowdsale.setMultiSig(multiSig, { from: owner });
        } catch (error) {
            assertError(error);
        }

        multiSigAddress = await crowdsale.multiSig();
        assert.strictEqual(multiSigAddress, multiSig);

    });


    /*----------- Rate Setter -----------*/


    it('should fail to set rate when rate is not greater than 0', async () => {
        try {
            await crowdsale.setRate(0, { from: owner });
        } catch (error) {
            assertError(error);
        }

        const rateIsSet = await crowdsale.rateSet();
        assert.isFalse(rateIsSet);
    });


    it('should fail to set rate when called by an address other than owner', async () => {
        try {
            await crowdsale.setRate(100, { from: accounts[3] });
        } catch (error) {
            assertError(error);
        }

        const rateIsSet = await crowdsale.rateSet();
        assert.isFalse(rateIsSet);
    });


    it('should fail to set rate when rate already set', async () => {

        await crowdsale.setRate(100, { from: owner });

        const rateIsSet = await crowdsale.rateSet();
        assert.isTrue(rateIsSet);

        let rate = await crowdsale.rate();
        assert.strictEqual(rate.toNumber(), 100)

        try {
            await crowdsale.setRate(200, { from: owner });
        } catch (error) {
            assertError(error);
        }

        rate = await crowdsale.rate();
        assert.strictEqual(rate.toNumber(), 100)

    });


    /*----------- Cap Setter -----------*/


    it('should fail to set cap when cap is not greater than 0', async () => {
        try {
            await crowdsale.setCap(0, { from: owner });
        } catch (error) {
            assertError(error);
        }

        const capIsSet = await crowdsale.capSet();
        assert.isFalse(capIsSet);
    });


    it('should fail to set cap when called by an address other than owner', async () => {
        try {
            await crowdsale.setCap(100, { from: accounts[3] });
        } catch (error) {
            assertError(error);
        }

        const capIsSet = await crowdsale.capSet();
        assert.isFalse(capIsSet);
    });


    it('should fail to set cap when cap already set', async () => {

        await crowdsale.setCap(100, { from: owner });

        const capIsSet = await crowdsale.capSet();
        assert.isTrue(capIsSet);

        let cap = await crowdsale.cap();
        assert.strictEqual(cap.toNumber(), 100)

        try {
            await crowdsale.setCap(200, { from: owner });
        } catch (error) {
            assertError(error);
        }

        cap = await crowdsale.cap();
        assert.strictEqual(cap.toNumber(), 100)

    });


    /*----------- Whitelist -----------*/


    it('should fail set to defaultWhitelistCap when called by an address other than owner', async () => {
        try {
            await crowdsale.setDefaultWhitelistCap(
                toWei(30303),
                { from: accounts[3] }
            );
        } catch (error) {
            assertError(error);
        }

        const whitelistCap = await crowdsale.defaultWhitelistCap();
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 0);
    });


    it('should set defaultWhitelistCap when called by owner', async () => {

        await crowdsale.setDefaultWhitelistCap(
            toWei(30303),
            { from: owner }
        );

        const whitelistCap = await crowdsale.defaultWhitelistCap();
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 30303);
    });


    it('Whitelist: it should fail if called by address other than owner', async () => {

        try {
            await crowdsale.setWhitelistAddress(
                accounts[0],
                toWei(30303),
                { from: accounts[3] }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no whitelist update took place.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[0]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 0);

    });


    it('Whitelist: it should update individual caps', async () => {

        await crowdsale.setWhitelistAddress(
            accounts[1],
            toWei(100),
            { from: owner }
        );

        // Confirm no whitelist update took place.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[1]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 100);

    });


    it('Batch Whitelist: it should fail if called by address other than owner', async () => {

        try {
            await crowdsale.setWhitelistAddressBatch(
                batchAddresses,
                batchAmounts,
                { from: accounts[3] }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no whitelist updates took place.
        const whitelistCap_0 = await crowdsale.getWhitelistCap(batchAddresses[0]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_0)), 0);

        const whitelistCap_1 = await crowdsale.getWhitelistCap(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_1)), 0);

        const whitelistCap_2 = await crowdsale.getWhitelistCap(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_2)), 0);

        const whitelistCap_3 = await crowdsale.getWhitelistCap(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_3)), 0);

        const whitelistCap_4 = await crowdsale.getWhitelistCap(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_4)), 0);

    });


    it('Batch Whitelist: it should succeed if called by owner', async () => {

        await crowdsale.setWhitelistAddressBatch(
            batchAddresses,
            batchAmounts,
            { from: owner }
        );

        // Confirm correct whitelist values.
        // batchAmounts is 1 therefore getWhitelistCap defers to `defaultWhitelistCap`
        // which was previously set to 30303.
        const whitelistCap_0 = await crowdsale.getWhitelistCap(batchAddresses[0]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_0)), 30303);

        const whitelistCap_1 = await crowdsale.getWhitelistCap(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_1)), 20);

        const whitelistCap_2 = await crowdsale.getWhitelistCap(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_2)), 30);

        const whitelistCap_3 = await crowdsale.getWhitelistCap(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_3)), 40);

        const whitelistCap_4 = await crowdsale.getWhitelistCap(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(whitelistCap_4)), 50);

    });


    /*----------- Presale Allocations -----------*/

    it('it should fail if called by address other than owner', async () => {

        await token.setUpReclaim({ from: owner });
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });

        try {
            await crowdsale.mintPresaleTokens(
                accounts[2],
                toWei(100),
                { from: accounts[3] }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance = await token.balanceOf(accounts[2]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('it should fail to send presale tokens to crowdsale multisig', async () => {

        try {
            await crowdsale.mintPresaleTokens(
                multiSig,
                toWei(100),
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance = await token.balanceOf(multiSig);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('it should fail to send presale tokens to null address', async () => {

        try {
            await crowdsale.mintPresaleTokens(
                0x0,
                toWei(100),
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance = await token.balanceOf(0x0);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('it should fail to send presale tokens to crowdsale address', async () => {

        try {
            await crowdsale.mintPresaleTokens(
                crowdsale.address,
                toWei(100),
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance = await token.balanceOf(crowdsale.address);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('it should send tokens to address specified', async () => {

        await crowdsale.mintPresaleTokens(accounts[3], toWei(100), { from: owner });

        // Confirm token transfer took place.
        const tokenBalance = await token.balanceOf(accounts[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 100);
    });


    it('it should send tokens to address specified, even when token paused', async () => {

        // Reclaim, pause, then hand back to crowdsale.
        await token.reclaimOwnership({ from: owner });
        await token.pause({ from: owner })
        await token.setUpReclaim({ from: owner });
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });

        await crowdsale.mintPresaleTokens(accounts[3], toWei(100), { from: owner });

        // Confirm token transfer took place.
        const tokenBalance = await token.balanceOf(accounts[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 200);
    });


    it('it should fail to transfer tokens while paused', async () => {

        try {
            await token.transfer(accounts[2], 100, { from: accounts[3] });
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance = await token.balanceOf(accounts[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 200);

    });

    /*----------- Batch Presale Allocations -----------*/

    it('Batch Presale: it should fail if called by address other than owner', async () => {

        try {
            await crowdsale.mintPresaleTokensBatch(
                batchAddresses,
                batchAmounts,
                { from: accounts[3] }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance_0 = await token.balanceOf(batchAddresses[0]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_0)), 0);

        const tokenBalance_1 = await token.balanceOf(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_1)), 0);

        const tokenBalance_2 = await token.balanceOf(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_2)), 0);

        const tokenBalance_3 = await token.balanceOf(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_3)), 0);

        const tokenBalance_4 = await token.balanceOf(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_4)), 0);

    });


    it('Batch Presale: it should fail if array lengths do not match', async () => {

        try {
            await crowdsale.mintPresaleTokensBatch(
                batchAddresses.slice(0,4),
                batchAmounts,
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }

        try {
            await crowdsale.mintPresaleTokensBatch(
                batchAddresses,
                batchAmounts.slice(0,4),
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }

        // Confirm no token transfer took place.
        const tokenBalance_0 = await token.balanceOf(batchAddresses[0]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_0)), 0);

        const tokenBalance_1 = await token.balanceOf(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_1)), 0);

        const tokenBalance_2 = await token.balanceOf(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_2)), 0);

        const tokenBalance_3 = await token.balanceOf(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_3)), 0);

        const tokenBalance_4 = await token.balanceOf(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_4)), 0);

    });


    it('Batch Presale: it should fail if array lengths are 0', async () => {

        try {
            await crowdsale.mintPresaleTokensBatch(
                [],
                [],
                { from: owner }
            );
        } catch (error) {
            assertError(error);
        }



        // Confirm no token transfer took place.
        const tokenBalance_0 = await token.balanceOf(batchAddresses[0]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_0)), 0);

        const tokenBalance_1 = await token.balanceOf(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_1)), 0);

        const tokenBalance_2 = await token.balanceOf(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_2)), 0);

        const tokenBalance_3 = await token.balanceOf(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_3)), 0);

        const tokenBalance_4 = await token.balanceOf(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_4)), 0);

    });


    it('Batch Presale: it should conduct multiple transfers', async () => {

        await crowdsale.mintPresaleTokensBatch(
            batchAddresses,
            batchAmounts,
            { from: owner }
        );

        // Confirm token transfer took place.
        const tokenBalance_0 = await token.balanceOf(batchAddresses[0]);
        // using to number as batchAmounts was set to simply 1 (not 1 converted to grains).
        assert.strictEqual(tokenBalance_0.toNumber(), 1);

        const tokenBalance_1 = await token.balanceOf(batchAddresses[1]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_1)), 20);

        const tokenBalance_2 = await token.balanceOf(batchAddresses[2]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_2)), 30);

        const tokenBalance_3 = await token.balanceOf(batchAddresses[3]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_3)), 40);

        const tokenBalance_4 = await token.balanceOf(batchAddresses[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_4)), 50);

    });


    /*----------- Crowdsale Participation -----------*/


    it('should fail prior to startTime', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }


        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail to accept payments if ownership not set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        await increaseTimeTo(startTime);

        // Set multiSig, rate, cap.
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail to accept payments if multisig not set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, rate, cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail to accept payments if rate not set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail to accept payments if cap not set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail if minimum contribution is not sent', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(151 * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );

        // Send 0 ETH
        try {
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: 0
            });

        } catch (error) {
            assertError(error);
        }


        // Confirm no token allocation took place.
        let tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);


        // Send below MINIMUM_CONTRIBUTION/
        try {
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(150)
            });

        } catch (error) {
            assertError(error);
        }


        // Confirm no token allocation took place.
        tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);


    });


    it('should accept payments if ownership, multisig, rate, and cap are set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(151 * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );


        // Purchase tokens.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[4],
            gas: 200000,
            value: toWei(151)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 5000);

    });


    it('should correctly track cumulative tokens sold and cumulative wei collected', async () => {
        const tokensSold = await crowdsale.tokensDistributed();
        const weiRaised = await crowdsale.weiRaised();

        assert.strictEqual(parseInt(fromWei(tokensSold)), 151 * (1.25) * 5000);
        assert.strictEqual(parseInt(fromWei(weiRaised)), 151);
    });


    it('should be forwarding funds to multisig address.', async () => {

        // await advanceBlock();

        const msAddress = await crowdsale.multiSig();
        const balance = await web3.eth.getBalance(multiSig);

        assert.strictEqual(parseInt(fromWei(balance)), 151);
    });


    it('should fail if address not whitelisted', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(151 * 3), { from: owner });


        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[5],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation took place.
        let tokenBalance = await token.balanceOf(accounts[5]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('should fail while Paused', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(151 * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(151),
            { from: owner }
        );


        // Pause and attempt purchase.
        await crowdsale.pause({ from: owner });

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        let tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);


        // Unause and attempt purchase.
        await crowdsale.unpause({ from: owner });

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[4],
            gas: 200000,
            value: toWei(151)
        });

        // Confirm token allocation took place.
        tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 5000);
    });


    it('should adjust permitted whitelist allowance after a purchase made.', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(151 * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(151 * 2),
            { from: owner }
        );

        // Make purchase.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(151)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 5000);

        // Confirm whitelist cap unchanged.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 151 * 2);

        // Confirm whitelist permitted amount is reduced by 151.
        const whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 151);
    });


    it('should fail if more than whitelisted amount sent', async () => {

        // 151 ETH already sent, 151 remaining. 152 should error out.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(152)
            });
        } catch (error) {
            assertError(error);
        }

        // 151 on the other hand should be permitted.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(151)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 2 * 5000);

        // Confirm whitelist cap unchanged.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), 151 * 2);

        // Confirm whitelist permitted amount is reduced by 151.
        const whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 0);
    });


    it('should reject payments once the whitelist cap is met', async () => {
        // Add one more round to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei((151 * 3)),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (151 * 3));

        // Permitted should be 151 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 151);

        // Sending 1 more than the cap fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(152)
            });
        } catch (error) {
            assertError(error);
        }

        // Sending upto the exact cap works.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(151)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 3 * 5000);

        // Permitted should be 0 ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 0);
    });


    /*----------- Token and ETH Caps -----------*/


    it('should reject payments once the crowdsale cap is met', async () => {
        // Add one more round to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei((151 * 4)),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (151 * 4));

        // Permitted should be 151 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 151);

        // Sending more than the crowdsale cap fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 151 * (1.25) * 3 * 5000);

        // Permitted should still be 151 ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 151);
    });


    it('should reject payments once the token cap is met', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        // 200000 tokens per ETH. Should permit 2 minimum ETH contributions of 151 ETH but not 3.
        // (151ETH * 200,000rate * 1.25bonus = 37,750,000tokens)
        await crowdsale.setRate(200000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Add 2x the minimum to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(151 * 3),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (151*3));

        // Permitted should be 151*3 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (151*3));

        // Make purchase.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(151 * 2)
        });

        // Sending another contribution of 151 ETH fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm second token allocation did not take place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 200000 * 151 * 2 * 1.25);

        // Permitted should be 2 ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 151);
    });



    /*----------- Bonus Calculations -----------*/


    it('should give correct bonuses', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Use default whitelist cap.
        await crowdsale.setDefaultWhitelistCap(
            toWei(30303),
            { from: owner }
        );

        // Add to whitelist.
        await crowdsale.setWhitelistAddressBatch(
            [accounts[5], accounts[8], accounts[9]],
            [1, 1, 1],
            { from: owner }
        );


        // Complete three purchases.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[5],
            gas: 200000,
            value: toWei(151)
        });

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[8],
            gas: 200000,
            value: toWei(303)
        });

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[9],
            gas: 200000,
            value: toWei(757)
        });



        // Confirm token allocation took place.
        const tokenBalance_0 = await token.balanceOf(accounts[5]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_0)), 151 * (1.25) * 5000);

        const tokenBalance_1 = await token.balanceOf(accounts[8]);
        assert.strictEqual(
            parseInt(fromWei(tokenBalance_1)),
            // Avoid floating point inpercision.
            new BigNumber(303).mul(130).div(100).mul(5000).toNumber()
        );

        const tokenBalance_2 = await token.balanceOf(accounts[9]);
        assert.strictEqual(parseInt(fromWei(tokenBalance_2)), 757 * (1.35) * 5000);

    });


    /*----------- Sale Close -----------*/


    it('should fail if ownerEnded, even if unpaused', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Add minimum to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(151),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (151));

        // Permitted should be 151 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (151));

        // End sale. Contributions should fail from here.
        await crowdsale.endSale({ from: owner });

        // Sending contribution of 151 ETH.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        let tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);


        // Call unpause method to confirm no effect on saleEnded.
        await crowdsale.pause({ from: owner });
        await crowdsale.unpause({ from: owner });

        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


    it('should not permit finalize prior to endTime or ownerEnded', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Try to finalize.
        try {
            await crowdsale.finalize({ from: owner });
        } catch (error) {
            assertError(error);
        }

        await crowdsale.endSale({ from: owner });
        await crowdsale.finalize({ from: owner });
        await token.claimOwnership({ from: owner });

        const tokenOwner = await token.owner();
        assert.strictEqual(tokenOwner, owner);

    });


    it('should permit finalize after endTime', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Shift time forward.
        await increaseTimeTo(endTime + 100);

        await crowdsale.finalize({ from: owner });
        await token.claimOwnership({ from: owner });

        const tokenOwner = await token.owner();
        assert.strictEqual(tokenOwner, owner);
    });


    it('should fail after endTime', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(5000, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });

        // Add minimum to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(151),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (151));

        // Permitted should be 151 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (151));


        // Sending contribution of 151 ETH.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(151)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        let tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

        // Confirm token allocation did not take place.
        tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);

    });


});

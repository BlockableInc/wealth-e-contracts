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


const million = 1e6;
let token;
let owner;
let multiSig;
let crowdsale;
let batchAddresses;
let batchAmounts;
const globalRate = 7000;
const globalTokenCap = 300 * million;
const globalPresaleMinETH = 41;
const presaleBonuses = [1.35, 1.4, 1.45];
const fullsaleBonuses = [1, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30];
const presaleBonuseThresholds = [globalPresaleMinETH, 83, 208];
const startTime = new Date('Thurs, 1 Feb 2018 00:00:00 GMT').getUnixTime();
const publicStartTime = new Date('Sun, 4 Mar 2018 00:00:00 GMT').getUnixTime();;
const endTime = new Date('Mon, 30 Apr 2018 00:00:00 GMT').getUnixTime();


const fullSaleDates = [
    // First hour.
    publicStartTime,
    // First day.
    publicStartTime + 7200,
    // First 2 - 4 days.
    publicStartTime + 172801,
    // First week (+ 5 days).
    publicStartTime + 432001,
    // Second week (+ 7 days).
    publicStartTime +  604801,
    // Third week.
    publicStartTime + 1209601,
    // Fourth week.
    publicStartTime + 1814401
];

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
        const publicStart = await crowdsale.PUBLIC_START_TIME();
        const fullSaleStart = await crowdsale.fullSaleStart();
        const grains = await crowdsale.GRAINS();
        const totalSaleTokens = await crowdsale.TOTAL_SALE_TOKENS();
        const minContribution = await crowdsale.MINIMUM_PRESALE_CONTRIBUTION();

        assert.strictEqual(start.toNumber(), startTime);
        assert.strictEqual(end.toNumber(), endTime);
        assert.strictEqual(publicStart.toNumber(), publicStartTime);
        assert.strictEqual(fullSaleStart.toNumber(), publicStartTime);
        assert.strictEqual(parseInt(fromWei(grains)), 1);
        assert.strictEqual(parseInt(fromWei(totalSaleTokens)), globalTokenCap);
        assert.strictEqual(parseInt(fromWei(minContribution)), globalPresaleMinETH);
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


    /*----------- Presale Cap Setter -----------*/


    it('should fail to set presaleCap when cap is not greater than 0', async () => {
        try {
            await crowdsale.setPresaleCap(0, { from: owner });
        } catch (error) {
            assertError(error);
        }

        const capIsSet = await crowdsale.presaleCapSet();
        assert.isFalse(capIsSet);
    });


    it('should fail to set presaleCap when called by an address other than owner', async () => {
        try {
            await crowdsale.setPresaleCap(100, { from: accounts[3] });
        } catch (error) {
            assertError(error);
        }

        const capIsSet = await crowdsale.presaleCapSet();
        assert.isFalse(capIsSet);
    });


    it('should fail to set presaleCap when cap already set', async () => {

        await crowdsale.setPresaleCap(100, { from: owner });

        const capIsSet = await crowdsale.presaleCapSet();
        assert.isTrue(capIsSet);

        let cap = await crowdsale.presaleCap();
        assert.strictEqual(cap.toNumber(), 100)

        try {
            await crowdsale.setPresaleCap(200, { from: owner });
        } catch (error) {
            assertError(error);
        }

        cap = await crowdsale.presaleCap();
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

        await token.setupReclaim({ from: owner });
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
        await token.setupReclaim({ from: owner });
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


    it('Batch Presale: it should fail surpasses TOTAL_SALE_TOKENS', async () => {

        try {
            await crowdsale.mintPresaleTokensBatch(
                batchAddresses,
                [100 * million, 50 * million, 50 * million, 50 * million, 51 * million].map(x => toWei(x)),
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setPresaleCap(toWei(100), { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
            });
        } catch (error) {
            assertError(error);
        }


        // Confirm no token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), 0);
    });


    it('should fail to accept payments if ownership not set', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        await increaseTimeTo(startTime);

        // Set multiSig, rate, cap.
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });
        await crowdsale.setPresaleCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(100), { from: owner });
        await crowdsale.setPresaleCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setPresaleCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setPresaleCap(toWei(100), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[4],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(globalPresaleMinETH * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(globalPresaleMinETH * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
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
                value: toWei(globalPresaleMinETH - 1)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(globalPresaleMinETH * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(globalPresaleMinETH * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
            { from: owner }
        );


        // Purchase tokens.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[4],
            gas: 200000,
            value: toWei(globalPresaleMinETH)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), parseInt(globalPresaleMinETH * (presaleBonuses[0]) * globalRate));

    });


    it('should correctly track cumulative tokens sold and cumulative wei collected', async () => {
        const tokensSold = await crowdsale.tokensDistributed();
        const weiRaised = await crowdsale.weiRaised();

        assert.strictEqual(parseInt(fromWei(tokensSold)), parseInt(globalPresaleMinETH * (presaleBonuses[0]) * globalRate));
        assert.strictEqual(parseInt(fromWei(weiRaised)), globalPresaleMinETH);
    });


    it('should be forwarding funds to multisig address.', async () => {

        // await advanceBlock();

        const msAddress = await crowdsale.multiSig();
        const balance = await web3.eth.getBalance(multiSig);

        assert.strictEqual(parseInt(fromWei(balance)), globalPresaleMinETH);
    });


    it('should fail if address not whitelisted', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(globalPresaleMinETH * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(globalPresaleMinETH * 3), { from: owner });


        try {
            // Purchase tokens.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[5],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(globalPresaleMinETH * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(globalPresaleMinETH * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[4],
            toWei(globalPresaleMinETH),
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
                value: toWei(globalPresaleMinETH)
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
            value: toWei(globalPresaleMinETH)
        });

        // Confirm token allocation took place.
        tokenBalance = await token.balanceOf(accounts[4]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), parseInt(globalPresaleMinETH * (presaleBonuses[0]) * globalRate));
    });


    it('should adjust permitted whitelist allowance after a purchase made.', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(globalPresaleMinETH * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(globalPresaleMinETH * 3), { from: owner });

        // Add to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(globalPresaleMinETH * 2),
            { from: owner }
        );

        // Make purchase.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(globalPresaleMinETH)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), parseInt(globalPresaleMinETH * (presaleBonuses[0]) * globalRate));

        // Confirm whitelist cap unchanged.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), globalPresaleMinETH * 2);

        // Confirm whitelist permitted amount is reduced by globalPresaleMinETH.
        const whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), globalPresaleMinETH);
    });


    it('should fail if more than whitelisted amount sent', async () => {

        // globalPresaleMinETH ETH already sent, globalPresaleMinETH remaining. globalPresaleMinETH + 1 should error out.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH + 1)
            });
        } catch (error) {
            assertError(error);
        }

        // globalPresaleMinETH on the other hand should be permitted.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(globalPresaleMinETH)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), parseInt(globalPresaleMinETH * (presaleBonuses[0]) * 2 * globalRate));

        // Confirm whitelist cap unchanged.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), globalPresaleMinETH * 2);

        // Confirm whitelist permitted amount is reduced by globalPresaleMinETH.
        const whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 0);
    });


    it('should reject payments once the whitelist cap is met', async () => {
        // Add one more round to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei((globalPresaleMinETH * 3)),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (globalPresaleMinETH * 3));

        // Permitted should be globalPresaleMinETH ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), globalPresaleMinETH);

        // Sending 1 more than the cap fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH + 1)
            });
        } catch (error) {
            assertError(error);
        }

        // Sending upto the exact cap works.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(globalPresaleMinETH)
        });

        // Confirm token allocation took place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), (globalPresaleMinETH * presaleBonuses[0]) * 3 * globalRate);

        // Permitted should be 0 ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), 0);
    });


    /*----------- Token and ETH Caps -----------*/


    it('should reject payments once the crowdsale cap is met', async () => {
        // Add one more round to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei((globalPresaleMinETH * 4)),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (globalPresaleMinETH * 4));

        // Permitted should be globalPresaleMinETH ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), globalPresaleMinETH);

        // Sending more than the crowdsale cap fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm token allocation did not take place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance)), globalPresaleMinETH * (presaleBonuses[0]) * 3 * globalRate);

        // Permitted should still be globalPresaleMinETH ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), globalPresaleMinETH);
    });


    it('should reject payments once the token cap is met', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Tokens per ETH. Should permit 2 contributions of globalPresaleMinETH but not 3 contributions.
        const localRate = parseInt(globalTokenCap / 2.7 / globalPresaleMinETH);

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(localRate, { from: owner });
        await crowdsale.setCap(toWei(localRate * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(localRate * 3), { from: owner });

        // Add 3x the rate to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(globalPresaleMinETH * 3),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (globalPresaleMinETH * 3));

        // Permitted should be globalPresaleMinETH*3 ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (globalPresaleMinETH * 3));

        // Make purchase.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[6],
            gas: 200000,
            value: toWei(globalPresaleMinETH * 2)
        });

        // Sending another contribution of globalPresaleMinETH ETH fails.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
            });
        } catch (error) {
            assertError(error);
        }

        // Confirm second token allocation did not take place.
        const tokenBalance = await token.balanceOf(accounts[6]);
        assert.strictEqual(parseInt(fromWei(tokenBalance).toNumber()), parseInt(localRate * globalPresaleMinETH * 2 * presaleBonuses[0]));

        // Permitted should be globalPresaleMinETH ETH.
        whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(fromWei(whitelistPermitted).toNumber(), globalPresaleMinETH);
    });



    /*----------- Bonus Calculations -----------*/


    it('should give correct bonuses', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

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
            value: toWei(presaleBonuseThresholds[0])
        });

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[8],
            gas: 200000,
            value: toWei(presaleBonuseThresholds[1])
        });

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[9],
            gas: 200000,
            value: toWei(presaleBonuseThresholds[2])
        });



        // Confirm token allocation took place.
        const tokenBalance_0 = await token.balanceOf(accounts[5]);
        assert.strictEqual(fromWei(tokenBalance_0).toNumber(), parseInt(presaleBonuseThresholds[0] * (presaleBonuses[0]) * globalRate));

        const tokenBalance_1 = await token.balanceOf(accounts[8]);
        assert.strictEqual(
            fromWei(tokenBalance_1).toNumber(),
            // Avoid floating point imprecision.
            new BigNumber(presaleBonuseThresholds[1]).mul((presaleBonuses[1]) * 100).div(100).mul(globalRate).toNumber()
        );

        const tokenBalance_2 = await token.balanceOf(accounts[9]);
        assert.strictEqual(Math.round(fromWei(tokenBalance_2).toNumber()), Math.round(presaleBonuseThresholds[2] * presaleBonuses[2] * globalRate));

    });


    /*----------- Transition to Full Sale -----------*/

    it('should transition to full sale once presaleCap reached', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(1, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303), { from: owner });

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

        // Currently during presale.
        assert.isTrue(await crowdsale.duringPresale());

        // Complete purchase.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[5],
            gas: 200000,
            value: toWei(30303)
        });


        // Confirm token allocation took place.
        const tokenBalance_0 = await token.balanceOf(accounts[5]);
        assert.strictEqual(fromWei(tokenBalance_0).toNumber(), 30303 * (presaleBonuses[2]) * 1);

        // Confirm transitioned into full sale.
        assert.isFalse(await crowdsale.duringPresale());
    });


    /*----------- Sale Close -----------*/


    it('should fail if ownerEnded, even if unpaused', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

        // Add minimum to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (globalPresaleMinETH));

        // Permitted should be globalPresaleMinETH ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (globalPresaleMinETH));

        // End sale. Contributions should fail from here.
        await crowdsale.endSale({ from: owner });

        // Sending contribution of globalPresaleMinETH ETH.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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
                value: toWei(globalPresaleMinETH)
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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

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



    /*----------- Time Based Bonuses -----------*/


    it('should give correct bonuses', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

        // Use default whitelist cap.
        await crowdsale.setDefaultWhitelistCap(
            toWei(30303),
            { from: owner }
        );

        // Add to whitelist.
        await crowdsale.setWhitelistAddressBatch(
            [
                accounts[10],
                accounts[11],
                accounts[12],
                accounts[13],
                accounts[14],
                accounts[15],
                accounts[16],
                accounts[17]
            ],
            [1, 1, 1, 1, 1, 1, 1, 1],
            { from: owner }
        );


        await increaseTimeTo(fullSaleDates[0]);
        assert.isFalse(await crowdsale.duringPresale());

        // Complete purchases at each time interval.
        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[10],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[1]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[11],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[2]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[12],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[3]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[13],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[4]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[14],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[5]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[15],
            gas: 200000,
            value: toWei(2)
        });

        await increaseTimeTo(fullSaleDates[6]);

        await web3.eth.sendTransaction({
            to: crowdsale.address,
            from: accounts[16],
            gas: 200000,
            value: toWei(2)
        });



        // Confirm token allocation took place.
        const tokenBalance_0 = await token.balanceOf(accounts[10]);
        assert.strictEqual(
            fromWei(tokenBalance_0).toNumber(),
            Math.round(2 * fullsaleBonuses[6] * globalRate, 0)
        );

        const tokenBalance_1 = await token.balanceOf(accounts[11]);
        assert.strictEqual(
            fromWei(tokenBalance_1).toNumber(),
            Math.round(2 * fullsaleBonuses[5] * globalRate, 0)
        );

        const tokenBalance_2 = await token.balanceOf(accounts[12]);
        assert.strictEqual(
            fromWei(tokenBalance_2).toNumber(),
            Math.round(2 * fullsaleBonuses[4] * globalRate, 0)
        );

        const tokenBalance_3 = await token.balanceOf(accounts[13]);
        assert.strictEqual(
            fromWei(tokenBalance_3).toNumber(),
            Math.round(2 * fullsaleBonuses[3] * globalRate, 0)
        );

        const tokenBalance_4 = await token.balanceOf(accounts[14]);
        assert.strictEqual(
            fromWei(tokenBalance_4).toNumber(),
            Math.round(2 * fullsaleBonuses[2] * globalRate, 0)
        );

        const tokenBalance_5 = await token.balanceOf(accounts[15]);
        assert.strictEqual(
            fromWei(tokenBalance_5).toNumber(),
            Math.round(2 * fullsaleBonuses[1] * globalRate, 0)
        );

        const tokenBalance_6 = await token.balanceOf(accounts[16]);
        assert.strictEqual(
            fromWei(tokenBalance_6).toNumber(),
            Math.round(2 * fullsaleBonuses[0] * globalRate, 0)
        );
    });

    /*----------- After endTime: Sale Close -----------*/


    it('should permit finalize after endTime', async () => {

        token = await WealthE.new({ from: owner });
        crowdsale = await WealthECrowdsale.new(token.address, { from: owner, gas: 4000000 });

        // Set ownership, multiSig, rate, and cap.
        await token.transferOwnership(crowdsale.address, { from: owner });
        await crowdsale.claimTokenOwnership({ from: owner });
        await crowdsale.setMultiSig(multiSig, { from: owner });
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

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
        await crowdsale.setRate(globalRate, { from: owner });
        await crowdsale.setCap(toWei(30303 * 3), { from: owner });
        await crowdsale.setPresaleCap(toWei(30303 * 3), { from: owner });

        // Add minimum to whitelist.
        await crowdsale.setWhitelistAddress(
            accounts[6],
            toWei(globalPresaleMinETH),
            { from: owner }
        );

        // Confirm whitelist cap changed.
        const whitelistCap = await crowdsale.getWhitelistCap(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistCap)), (globalPresaleMinETH));

        // Permitted should be globalPresaleMinETH ETH.
        let whitelistPermitted = await crowdsale.whitelistPermittedAmount(accounts[6]);
        assert.strictEqual(parseInt(fromWei(whitelistPermitted)), (globalPresaleMinETH));


        // Sending contribution of globalPresaleMinETH ETH.
        try {
            // Make purchase.
            await web3.eth.sendTransaction({
                to: crowdsale.address,
                from: accounts[6],
                gas: 200000,
                value: toWei(globalPresaleMinETH)
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

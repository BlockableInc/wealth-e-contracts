
import { assertError } from './utils';
const WealthE = artifacts.require("./WealthE.sol");


let token;
let owner;

contract('WealthE', (accounts) => {
    before(async () => {
        owner = accounts[0];
        token = await WealthE.new({ from: owner });
    });


    it('should have correct name, symbol, and decimals', async () => {
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();

        assert.strictEqual(name, 'Wealth-E');
        assert.strictEqual(symbol, 'WRE');
        assert.strictEqual(decimals.toNumber(), 18);
    });


    it('should pause and unpause token transfers', async () => {
        await token.mint(owner, 100, { from: owner });
        await token.transfer(accounts[1], 100, { from: owner });
        await token.pause({ from: owner });

        let balance1;
        let balance2;

        // Assert transfer took place.
        balance1 = await token.balanceOf(accounts[1]);
        assert.strictEqual(balance1.toNumber(), 100);

        // Attempt to transfer.
        try {
            await token.transfer(accounts[2], 100, { from: accounts[1] });
        } catch (error) {
            assertError(error);
        }

        // Assert balances did not change while paused.
        balance1 = await token.balanceOf.call(accounts[1]);
        balance2 = await token.balanceOf.call(accounts[2]);
        assert.strictEqual(balance1.toNumber(), 100);
        assert.strictEqual(balance2.toNumber(), 0);

        // Assert transfer takes place after unpausing.
        await token.unpause({ from: owner });
        await token.transfer(accounts[2], 100, { from: accounts[1] });
        balance1 = await token.balanceOf.call(accounts[1]);
        balance2 = await token.balanceOf.call(accounts[2]);
        assert.strictEqual(balance1.toNumber(), 0);
        assert.strictEqual(balance2.toNumber(), 100);
    });


    it('should stop minting once minting revoked', async () => {
        await token.finishMinting({ from: owner });

        // Attempt to mint.
        try {
            await token.mint(accounts[1], 100, { from: accounts[1] });
        } catch (error) {
            assertError(error);
        }

        // Asset public state is mintingFinished.
        const mintingState = await token.mintingFinished();
        assert.isTrue(mintingState);
    });


    /*----------- Ownership -----------*/


    it('should transfer ownership in claimable fashion', async () => {

        // Transfer Ownership
        await token.transferOwnership(accounts[1], { from: owner });
        await token.claimOwnership({ from: accounts[1] });

        let ownerAddress = await token.owner();
        assert.strictEqual(ownerAddress, accounts[1]);

        // Transfer back.
        await token.transferOwnership(owner, { from: accounts[1] });
        await token.claimOwnership({ from: owner });

        ownerAddress = await token.owner();
        assert.strictEqual(ownerAddress, owner);


    });


    it('should fail if address other than owner calls `setUpReclaim`', async () => {

        // Attempt to setUpReclaim.
        try {
            await token.setUpReclaim({ from: accounts[1] });
        } catch (error) {
            assertError(error);
        }

        // Confirm no change to address.
        assert.strictEqual(
            await token.reclaimableOwner(),
            '0x0000000000000000000000000000000000000000'
        );

    });


    it('should permit current owner to `setUpReclaim`', async () => {

        // Attempt to setUpReclaim.
        await token.setUpReclaim({ from: owner });

        // Confirm no change to address.
        assert.strictEqual(await token.reclaimableOwner(), owner);

    });


    it('should fail if address other than reclaimableOwner calls `resetReclaim`', async () => {

        // Attempt to setUpReclaim.
        try {
            await token.resetReclaim({ from: accounts[1] });
        } catch (error) {
            assertError(error);
        }

        // Confirm no change to address.
        assert.strictEqual(await token.reclaimableOwner(), owner);

    });


    it('should permit current reclaimableOwner to `resetReclaim`', async () => {

        // Attempt to setUpReclaim.
        await token.resetReclaim({ from: owner });

        // Confirm reset occured.
        assert.strictEqual(
            await token.reclaimableOwner(),
            '0x0000000000000000000000000000000000000000'
        );

    });


    it('should fail if address other than reclaimableOwner calls `reclaimOwnership`', async () => {

        // Current owner can reclaim.
        await token.setUpReclaim({ from: owner });

        // Transfer ownership to another address.
        await token.transferOwnership(accounts[1], { from: owner });
        await token.claimOwnership({ from: accounts[1] });
        assert.strictEqual(await token.owner(), accounts[1]);

        // Attempt to reclaim from wrong address.
        try {
            await token.reclaimOwnership({ from: accounts[2] });
        } catch (error) {
            assertError(error);
        }

        // Confirm no change to address.
        assert.strictEqual(await token.reclaimableOwner(), owner);

    });


    it('should permit current reclaimableOwner to `reclaimOwnership`', async () => {

        // Attempt to reclaim ownership.
        await token.reclaimOwnership({ from: owner });

        // Confirm reset occured.
        assert.strictEqual(await token.owner(), owner);
        assert.strictEqual(
            await token.reclaimableOwner(),
            '0x0000000000000000000000000000000000000000'
        );

    });

    it('should fail if address other than reclaimableOwner calls `setUpReclaim`', async () => {

        // Current owner can reclaim.
        await token.setUpReclaim({ from: owner });

        // Transfer ownership to another address.
        await token.transferOwnership(accounts[1], { from: owner });
        await token.claimOwnership({ from: accounts[1] });
        assert.strictEqual(await token.owner(), accounts[1]);

        // Attempt to reclaim from wrong address.
        try {
            await token.setUpReclaim({ from: accounts[1] });
        } catch (error) {
            assertError(error);
        }

        // Confirm no change to address.
        assert.strictEqual(await token.reclaimableOwner(), owner);

    });


});

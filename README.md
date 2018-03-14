# WealthMigrate Token and Crowdsale Contracts


## Requirements

```{sh}
Truffle v4.0.1 (core: 4.0.1)
Solidity v0.4.18 (solc-js)
Ganache CLI v6.0.3 (ganache-core: 2.0.2)
```


## Setup

```{sh}
$ yarn
```

## Testing

```
$ npm run ganache-cli
$ truffle test
```

Note: Crowdsale contract tests shift ganache time forward. To test multiple times, restart ganache.

### Debugging

If encounter `Error: Invalid number of arguments to Solidity function` run `npm run clean` to remove the build directory and rerun the above testing commands.


## Deployment steps

#### Covered by truffle migrate

  1. Launch both the token and the crowdsale contracts to the public blockchain.
  2. Launch the timelock contract.

#### Covered by initContracts.js

  3. Pause token transfers.
  4. Transfer ownership of the timelock contract to the crowdsale contract.
  5. Claim ownership of the timelock contract on the crwodsale contract.
  6. Set the timelock address on the crowdsale contract.

#### Requires manual execution

  7. Call `setUpReclaim` as a safeguard on the token contract.
  8. Transfer ownership of the token to the crowdsale contract for minting purposes.
  9. Call `claimTokenOwnership` on the crowdsale contract to complete the ownership transfer.
  10. Set the tokens per ETH rate.
  11. Set the sale hardcap.
  12. Set the setDefaultWhitelistCap.
  13. Set whitelist participant addresses and approved amounts.

## Finalization

  1. Calling the `finalize` method transfers ownership of token back to crowdsale contract owner.
  2. IMPORTANT: The contract owner must claim the token with `claimOwnership` for the transfer of ownership to be complete.

The token ownerwill be responsible for removing the ability to mint further tokens.

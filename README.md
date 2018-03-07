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


  1. Launch both the token and the crowdsale contracts to the public blockchain.
  2. Pause token transfers.
  3. Call `setUpReclaim` as a safeguard on the token contract.
  3. Transfer ownership of the token to the crowdsale contract for minting purposes.
  4. Call `claimTokenOwnership` on the crowdsale contract to complete the ownership transfer.
  5. Launch the timelock contract.
  6. Transfer ownership of the timelock contract to the crowdsale contract.
  7. Set the token address on the timelock contract.
  8. Set the timelick address on the crowdsale contract.
  9. Set the multisig address to receive funds collected.
  10. Set the tokens per ETH rate.
  11. Set the sale hardcap.
  12. Set the setDefaultWhitelistCap.
  13. Set whitelist participant addresses and approved amounts.

## Finalization

  1. Calling the `finalize` method transfers ownership of token back to crowdsale contract owner.
  2. IMPORTANT: The contract owner must claim the token with `claimOwnership` for the transfer of ownership to be complete.

Ownership of token is needed for second and final public sale. The second sale will be responsible for removing the ability to mint further tokens as well as handling the remaining allocations (team/advisor, etc.) and associated vesting.

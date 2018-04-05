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

## Testnet Testing

```
$ truffle migrate --network rinkeby
```

Then confirm the correct network addresses appear in the `build/contracts/` directory (manual update needed for WealthECrowdsale.json and TokenTimelock.json)

```
$ truffle exec initContracts.js --network rinkeby
```

### Debugging

If encounter `Error: Invalid number of arguments to Solidity function` run `npm run clean` to remove the build directory and rerun the above testing commands.


## Deployment steps

#### Covered by truffle migrate

  1. Launch both the token contracts to the public blockchain.

#### Covered by initContracts.js

  2. Pause token transfers.
  3. Transfer ownership of the token to the client's address.


The token ownerwill be responsible for removing the ability to mint further tokens.

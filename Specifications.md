# Token Contract

The token will be an ERC-20 compliant token on the Ethereum blockchain.

## Token Properties

Name: Wealth-E

Symbol: WRE

Decimals: 18

- [ ] test coverage complete


## Token Methods

Is Pausable. The owner address can pause and unpause token transfers.

Is claimable. Ownership transfers must be claimed but recipient address as a safeguard.

Is reclaimable. The owner can activate a reclaim process prior to transferring ownership. To be used as a failsafe in the event the crowdsale cannot transfer ownership back.

Fixed supply (revoke minting ability after crowdsale).

- [x] test coverage complete


# Crowdsale Contract

The crowdsale contract is for the presale and full public sale.
The presale will last until February 10th or until the equivalent of $10 million in ETH is raised.
The full public sale will end March 31st or when the equivalent of $30 million in ETH is raised.


## Key Dates

Public sale start: January 10, 2018 12:00am GMT

Public sale end: March 31, 2018 12:00am GMT

Owner is permitted to close the presale early.

- [ ] test coverage complete


## Crowdsale Methods

Is Pausable. The owner address can pause and unpause the crowdsale at anytime. Unpausing after the sale has closed will not permit the sale to continue.

- [x] test coverage complete


## Funds collected

Funds collected are to be stored in a multisig wallet. As such, the crowdsale contract allows for a one time setting of multisig address.

The crowdsale contract forwards funds to multisig upon receipt.

- [x] test coverage complete


## Caps

The crowdsale will have a firm cap set in ETH. The hardcap is to be converted from USD to ETH prior to the sale commencing and set using `setCap`. Hardcap setter allows a one time setting of that hard cap (ETH equivalent of USD hardcap)

In addition to the ETH hardcap, no more than `300 million` tokens are to be sold in this sale.

- [ ] test coverage complete


## Distribution

Addresses and vesting required for reserve, team, and network growth unless handled outside of the smart contract.

  - Crowdsale: 50% (300 million WRE)
  - Reserve 20% (120 million WRE)
  - Team 20% (120 million WRE)
  - Network Growth 10% (60 million WRE)

- [ ] test coverage complete


## Whitelist

For KYC/AML compliance crowdsale contributors must be whitelisted to participate. The whitelist consists of an address and a permitted contribution amount. To defer to the default permitted amount addresses will be approved with a value of `1` otherwise a value denoted in `wei` is to be indicated.

The contract owner may add users to the whitelist at any time, and may change the permitted contribution amount at any time.

The smart contract will reject contributions from addresses not included in the whitelist.

- [x] test coverage complete


## Token Issuance

Tokens are distributed as each contribution takes place. However, tokens are to be manually locked until the completion of the full public sale. To be manually unlocked by owner.

- [x] test coverage complete


## Rates


### Presale Bonuses:

Based on USD bonus tiers when ETH/USD is $330.

Fixed bonuses based in ETH to allow for hardcoding into the smart contract.

ETH equivalents below rounded down to nearest ETH.

Minimum: `151 ETH (~$50K USD)`

#### Bonus tiers

$250K+: 45%
$100K+ < $250K: 40%
$50K+ < $100K: 35%

  - ~`757 ETH (~$250K+ USD):` 35%~
  - ~`303 ETH (~$100K+):` 30%~
  - ~`151 ETH (~$50K USD):` 25%~

~Note: Individual hardcap of up to `30303 ETH (~$10M)`. (To be handled manually by whitelistDefault setter.)~

Note: Due to integer rounding, calculations are accurate to within 1 wei (0.000000000000000001 ETH)

- [] test coverage complete


### Full Sale Bonuses

1. Hour 1: 30%
2. Day 1: 25%
3. Day 2-4: 20%
4. Week 1: 15%
5. Week 2: 10%
6. Week 3: 5%
7. Week 4: 0%


## Finalize

Transfer ownership back to owner.

- [x] test coverage complete

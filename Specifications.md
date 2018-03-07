# Token Contract

The token will be an ERC-20 compliant token on the Ethereum blockchain.

## Token Properties

Name: Wealth-E

Symbol: WRE

Decimals: 18

- [x] test coverage complete


## Token Methods

Is Pausable. The owner address can pause and unpause token transfers.

Is claimable. Ownership transfers must be claimed but recipient address as a safeguard.

Is reclaimable. The owner can activate a reclaim process prior to transferring ownership. To be used as a failsafe in the event the crowdsale cannot transfer ownership back.

Fixed supply (revoke minting ability after crowdsale).

- [x] test coverage complete


# Crowdsale Contract

The crowdsale contract is for the presale and full public sale.
The presale will last until March 4th or until the equivalent of $10 million in ETH is raised.
The full public sale will end April 30th or when the equivalent of $30 million in ETH is raised.


## Key Dates

Public presale start:  February 1, 2018 12:00am GMT

Full public sale start: Wednesday, April 4, 2018 12:00:00 AM GMT

Full public sale end: Monday, May 21, 2018 12:00:00 AM GMT

Owner is permitted to close the sale early.

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

- [x] test coverage complete


## Presale Cap

Additionally there is a presale cap. Once reached the sale converts to the full public sale with a separate set of bonus conditions.

- [x] test coverage complete


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

Initial price to be the ETH equivalent of USD $0.10. Test cases assume $1200 USD per ETH.

Initial rate is 12,000 WRE per ETH.


### Presale Bonuses:

Based on USD bonus tiers when ETH/USD is $1200.

Fixed bonuses based in ETH to allow for hardcoding into the smart contract.

ETH equivalents below rounded to nearest ETH.

Minimum: `41 ETH (~$50K USD)`

- [x] test coverage complete


#### Bonus tiers

  - if spend >= $250K (208 ETH): 45%
  - if spend >= $100K (83 ETH): 40%
  - if spend >= $50K (41): 35%
  - if spend < $50k: 0%


~Note: Individual hardcap of up to `25,000 ETH (~$10M)`. (To be handled manually by whitelistDefault setter.)~

Note: Due to integer rounding, calculations are accurate to within 1 wei (0.000000000000000001 ETH)

- [x] test coverage complete


### Full Sale Bonuses

1. Hour 1: 30%
2. Day 1: 25%
3. Day 2-4: 20%
4. Week 1: 15%
5. Week 2: 10%
6. Week 3: 5%
7. Week 4: 0%


- [x] test coverage complete

## Finalize

Transfer ownership back to owner.

- [x] test coverage complete

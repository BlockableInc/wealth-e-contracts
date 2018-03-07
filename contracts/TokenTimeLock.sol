pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Claimable.sol';


/**
 * @title TokenTimelock
 * @dev TokenTimelock is a token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time
 */
contract TokenTimelock is Claimable {
    using SafeERC20 for ERC20Basic;
    using SafeMath for uint256;

    // ERC20 basic token contract being held
    ERC20Basic public token;

    // beneficiary of tokens after they are released
    mapping (address => uint250) public beneficiaryMap;

    // timestamp when token release is enabled
    uint256 public releaseTime;

    // tokens deposited.
    uint256 tokenBalance;

    function TokenTimelock(ERC20Basic _token, uint256 _releaseTime)
        public
    {
        require(_releaseTime > now);
        token = _token;
        releaseTime = _releaseTime;
    }

    /**
     * @param investor Investor address
     */
    function depositTokens(address _beneficiary, uint256 _amount)
        public
        onlyOwner
    {
        // Confirm tokens transfered
        // (tokens initially paused and can only be transfered by having them minted to this address).
        require(tokenBalance.add(_amount) == token.balanceOf(this));
        tokenBalance = tokenBalance.add(_amount);

        // Increment total tokens owed.
        beneficiaryMap[_beneficiary] = beneficiaryMap[_beneficiary].add(_amount);
    }

    /**
    * @notice Transfers tokens held by timelock to beneficiary.
    */
    function release() public {
        require(now >= releaseTime);

        // Get tokens owed, then set to 0 before proceeding.
        uint256 amount = beneficiaryMap[msg.sender];
        beneficiaryMap[msg.sender] = 0;

        // Proceed only of there are tokens to send.
        require(amount > 0 && token.balanceOf(this) > 0);

        token.safeTransfer(beneficiary, amount);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WydaTumbler
 * @dev A privacy-focused token mixer for the WYDA token on BNB Smart Chain.
 * This contract allows users to deposit fixed amounts of WYDA and withdraw them 
 * to a different address after a delay, breaking the on-chain link.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WydaTumbler {
    IERC20 public immutable wydaToken;
    
    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        bool withdrawn;
        bytes32 commitment;
    }

    mapping(bytes32 => Deposit) public deposits;
    uint256 public constant MIXING_FEE_BPS = 10; // 0.1%
    uint256 public constant MIN_DELAY = 1 hours;
    
    event Deposited(bytes32 indexed commitment, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount, bytes32 indexed commitment);

    constructor(address _wydaToken) {
        wydaToken = IERC20(_wydaToken);
    }

    /**
     * @dev Deposit WYDA into the tumbler.
     * @param commitment A hash of a secret and nullifier to be used for withdrawal.
     * @param amount The amount of WYDA to deposit.
     */
    function deposit(bytes32 commitment, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[commitment].amount == 0, "Commitment already exists");

        require(wydaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        deposits[commitment] = Deposit({
            amount: amount,
            timestamp: block.timestamp,
            withdrawn: false,
            commitment: commitment
        });

        emit Deposited(commitment, amount, block.timestamp);
    }

    /**
     * @dev Withdraw WYDA to a new address.
     * @param secret The secret used to generate the commitment.
     * @param nullifier The nullifier used to generate the commitment.
     * @param to The destination address.
     */
    function withdraw(bytes32 secret, bytes32 nullifier, address to) external {
        bytes32 commitment = keccak256(abi.encodePacked(secret, nullifier));
        Deposit storage d = deposits[commitment];

        require(d.amount > 0, "Deposit not found");
        require(!d.withdrawn, "Already withdrawn");
        require(block.timestamp >= d.timestamp + MIN_DELAY, "Mixing delay not met");

        d.withdrawn = true;
        
        uint256 fee = (d.amount * MIXING_FEE_BPS) / 10000;
        uint256 withdrawAmount = d.amount - fee;

        require(wydaToken.transfer(to, withdrawAmount), "Transfer failed");
        
        emit Withdrawn(to, withdrawAmount, commitment);
    }
}

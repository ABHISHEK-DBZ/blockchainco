// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonCredit {
    struct Credit {
        uint256 id;
        address owner;
        uint256 amount;
        string projectName;
        uint256 issuedOn;
    }

    mapping(uint256 => Credit) public credits;
    uint256 public nextId;

    event CreditIssued(uint256 id, address owner, uint256 amount, string projectName, uint256 issuedOn);

    function issueCredit(address owner, uint256 amount, string memory projectName) public returns (uint256) {
        uint256 issuedOn = block.timestamp;
        credits[nextId] = Credit(nextId, owner, amount, projectName, issuedOn);
        emit CreditIssued(nextId, owner, amount, projectName, issuedOn);
        nextId++;
        return nextId - 1;
    }

    function getCredit(uint256 id) public view returns (address, uint256, string memory, uint256) {
        Credit memory c = credits[id];
        return (c.owner, c.amount, c.projectName, c.issuedOn);
    }
}

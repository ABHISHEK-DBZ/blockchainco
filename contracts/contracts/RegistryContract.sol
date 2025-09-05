// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RegistryContract
 * @dev Manages participant registration and identity verification for Blue Carbon Registry
 */
contract RegistryContract is Ownable, ReentrancyGuard {
    
    enum ParticipantType { NGO, Panchayat, Community, FieldAgent, Verifier }
    enum Status { Pending, Approved, Rejected, Suspended }
    
    struct Participant {
        address walletAddress;
        string name;
        string contactInfo;
        string documentHash; // IPFS hash of verification documents
        ParticipantType participantType;
        Status status;
        uint256 registrationTime;
        string region; // Geographic region of operation
    }
    
    // Mapping from participant address to their details
    mapping(address => Participant) public participants;
    
    // Array to track all registered participants
    address[] public participantAddresses;
    
    // Events
    event ParticipantRegistered(address indexed participant, ParticipantType participantType, string name);
    event ParticipantApproved(address indexed participant);
    event ParticipantRejected(address indexed participant, string reason);
    event ParticipantSuspended(address indexed participant, string reason);
    
    modifier onlyApproved() {
        require(participants[msg.sender].status == Status.Approved, "Participant not approved");
        _;
    }
    
    /**
     * @dev Register a new participant
     */
    function registerParticipant(
        string memory _name,
        string memory _contactInfo,
        string memory _documentHash,
        ParticipantType _participantType,
        string memory _region
    ) external nonReentrant {
        require(participants[msg.sender].walletAddress == address(0), "Already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_documentHash).length > 0, "Document hash required");
        
        participants[msg.sender] = Participant({
            walletAddress: msg.sender,
            name: _name,
            contactInfo: _contactInfo,
            documentHash: _documentHash,
            participantType: _participantType,
            status: Status.Pending,
            registrationTime: block.timestamp,
            region: _region
        });
        
        participantAddresses.push(msg.sender);
        
        emit ParticipantRegistered(msg.sender, _participantType, _name);
    }
    
    /**
     * @dev Approve a participant (only owner/NCCR can do this)
     */
    function approveParticipant(address _participant) external onlyOwner {
        require(participants[_participant].walletAddress != address(0), "Participant not found");
        require(participants[_participant].status == Status.Pending, "Invalid status");
        
        participants[_participant].status = Status.Approved;
        emit ParticipantApproved(_participant);
    }
    
    /**
     * @dev Reject a participant
     */
    function rejectParticipant(address _participant, string memory _reason) external onlyOwner {
        require(participants[_participant].walletAddress != address(0), "Participant not found");
        require(participants[_participant].status == Status.Pending, "Invalid status");
        
        participants[_participant].status = Status.Rejected;
        emit ParticipantRejected(_participant, _reason);
    }
    
    /**
     * @dev Suspend a participant
     */
    function suspendParticipant(address _participant, string memory _reason) external onlyOwner {
        require(participants[_participant].walletAddress != address(0), "Participant not found");
        require(participants[_participant].status == Status.Approved, "Invalid status");
        
        participants[_participant].status = Status.Suspended;
        emit ParticipantSuspended(_participant, _reason);
    }
    
    /**
     * @dev Get participant details
     */
    function getParticipant(address _participant) external view returns (Participant memory) {
        return participants[_participant];
    }
    
    /**
     * @dev Check if participant is approved
     */
    function isApproved(address _participant) external view returns (bool) {
        return participants[_participant].status == Status.Approved;
    }
    
    /**
     * @dev Get total number of participants
     */
    function getTotalParticipants() external view returns (uint256) {
        return participantAddresses.length;
    }
    
    /**
     * @dev Get participants by type and status
     */
    function getParticipantsByType(ParticipantType _type, Status _status) 
        external view returns (address[] memory) {
        uint256 count = 0;
        
        // First pass: count matching participants
        for (uint256 i = 0; i < participantAddresses.length; i++) {
            address addr = participantAddresses[i];
            if (participants[addr].participantType == _type && 
                participants[addr].status == _status) {
                count++;
            }
        }
        
        // Second pass: collect matching participants
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < participantAddresses.length; i++) {
            address addr = participantAddresses[i];
            if (participants[addr].participantType == _type && 
                participants[addr].status == _status) {
                result[index] = addr;
                index++;
            }
        }
        
        return result;
    }
}

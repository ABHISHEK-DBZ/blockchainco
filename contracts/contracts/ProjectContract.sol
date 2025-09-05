// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RegistryContract.sol";

/**
 * @title ProjectContract
 * @dev Manages the lifecycle of blue carbon restoration projects
 */
contract ProjectContract is Ownable, ReentrancyGuard {
    
    enum ProjectStatus { Registered, Active, UnderVerification, Verified, Completed, Suspended }
    enum EcosystemType { Mangrove, Seagrass, SaltMarsh, CoralReef }
    
    struct Project {
        uint256 id;
        string name;
        string description;
        address owner; // NGO or Panchayat address
        EcosystemType ecosystemType;
        string location; // Geographic coordinates or region name
        uint256 areaHectares; // Area in hectares
        uint256 registrationTime;
        ProjectStatus status;
        string[] mrvDataHashes; // Array of IPFS hashes for MRV data
        uint256 estimatedCarbonSequestration; // Tonnes CO2 equivalent
        uint256 verifiedCarbonSequestration; // Verified tonnes CO2 equivalent
        address verifier; // Address of the verifier
        string verificationReportHash; // IPFS hash of verification report
        uint256 verificationTime;
    }
    
    struct MRVData {
        string dataHash; // IPFS hash
        uint256 timestamp;
        address submittedBy;
        string dataType; // "initial", "monitoring", "drone", "field_survey"
        string description;
    }
    
    // Registry contract reference
    RegistryContract public registryContract;
    
    // Storage
    mapping(uint256 => Project) public projects;
    mapping(uint256 => MRVData[]) public projectMRVData;
    uint256 public nextProjectId = 1;
    uint256[] public projectIds;
    
    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name);
    event ProjectActivated(uint256 indexed projectId);
    event MRVDataSubmitted(uint256 indexed projectId, string dataHash, string dataType);
    event ProjectSubmittedForVerification(uint256 indexed projectId);
    event ProjectVerified(uint256 indexed projectId, uint256 carbonSequestration, address verifier);
    event ProjectCompleted(uint256 indexed projectId);
    event ProjectSuspended(uint256 indexed projectId, string reason);
    
    modifier onlyApprovedParticipant() {
        require(registryContract.isApproved(msg.sender), "Not an approved participant");
        _;
    }
    
    modifier onlyProjectOwner(uint256 _projectId) {
        require(projects[_projectId].owner == msg.sender, "Not project owner");
        _;
    }
    
    modifier onlyVerifier() {
        RegistryContract.Participant memory participant = registryContract.getParticipant(msg.sender);
        require(participant.participantType == RegistryContract.ParticipantType.Verifier, "Not a verifier");
        require(registryContract.isApproved(msg.sender), "Verifier not approved");
        _;
    }
    
    constructor(address _registryContract) {
        registryContract = RegistryContract(_registryContract);
    }
    
    /**
     * @dev Register a new restoration project
     */
    function registerProject(
        string memory _name,
        string memory _description,
        EcosystemType _ecosystemType,
        string memory _location,
        uint256 _areaHectares,
        uint256 _estimatedCarbonSequestration
    ) external onlyApprovedParticipant nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_location).length > 0, "Location required");
        require(_areaHectares > 0, "Area must be greater than 0");
        
        uint256 projectId = nextProjectId++;
        
        projects[projectId] = Project({
            id: projectId,
            name: _name,
            description: _description,
            owner: msg.sender,
            ecosystemType: _ecosystemType,
            location: _location,
            areaHectares: _areaHectares,
            registrationTime: block.timestamp,
            status: ProjectStatus.Registered,
            mrvDataHashes: new string[](0),
            estimatedCarbonSequestration: _estimatedCarbonSequestration,
            verifiedCarbonSequestration: 0,
            verifier: address(0),
            verificationReportHash: "",
            verificationTime: 0
        });
        
        projectIds.push(projectId);
        
        emit ProjectRegistered(projectId, msg.sender, _name);
        return projectId;
    }
    
    /**
     * @dev Activate a project (start restoration activities)
     */
    function activateProject(uint256 _projectId) 
        external onlyOwner {
        require(projects[_projectId].status == ProjectStatus.Registered, "Invalid status");
        
        projects[_projectId].status = ProjectStatus.Active;
        emit ProjectActivated(_projectId);
    }
    
    /**
     * @dev Submit MRV data for a project
     */
    function submitMRVData(
        uint256 _projectId,
        string memory _dataHash,
        string memory _dataType,
        string memory _description
    ) external onlyApprovedParticipant {
        require(projects[_projectId].id != 0, "Project not found");
        require(projects[_projectId].status == ProjectStatus.Active, "Project not active");
        require(bytes(_dataHash).length > 0, "Data hash required");
        
        // Add to project's MRV data array
        projects[_projectId].mrvDataHashes.push(_dataHash);
        
        // Store detailed MRV data
        projectMRVData[_projectId].push(MRVData({
            dataHash: _dataHash,
            timestamp: block.timestamp,
            submittedBy: msg.sender,
            dataType: _dataType,
            description: _description
        }));
        
        emit MRVDataSubmitted(_projectId, _dataHash, _dataType);
    }
    
    /**
     * @dev Submit project for verification
     */
    function submitForVerification(uint256 _projectId) 
        external onlyProjectOwner(_projectId) {
        require(projects[_projectId].status == ProjectStatus.Active, "Invalid status");
        require(projects[_projectId].mrvDataHashes.length > 0, "No MRV data submitted");
        
        projects[_projectId].status = ProjectStatus.UnderVerification;
        emit ProjectSubmittedForVerification(_projectId);
    }
    
    /**
     * @dev Verify a project and set carbon sequestration amount
     */
    function verifyProject(
        uint256 _projectId,
        uint256 _verifiedCarbonSequestration,
        string memory _verificationReportHash
    ) external onlyVerifier {
        require(projects[_projectId].status == ProjectStatus.UnderVerification, "Invalid status");
        require(_verifiedCarbonSequestration > 0, "Carbon sequestration must be greater than 0");
        require(bytes(_verificationReportHash).length > 0, "Verification report hash required");
        
        projects[_projectId].status = ProjectStatus.Verified;
        projects[_projectId].verifiedCarbonSequestration = _verifiedCarbonSequestration;
        projects[_projectId].verifier = msg.sender;
        projects[_projectId].verificationReportHash = _verificationReportHash;
        projects[_projectId].verificationTime = block.timestamp;
        
        emit ProjectVerified(_projectId, _verifiedCarbonSequestration, msg.sender);
    }
    
    /**
     * @dev Complete a project
     */
    function completeProject(uint256 _projectId) external onlyOwner {
        require(projects[_projectId].status == ProjectStatus.Verified, "Project not verified");
        
        projects[_projectId].status = ProjectStatus.Completed;
        emit ProjectCompleted(_projectId);
    }
    
    /**
     * @dev Suspend a project
     */
    function suspendProject(uint256 _projectId, string memory _reason) external onlyOwner {
        require(projects[_projectId].id != 0, "Project not found");
        
        projects[_projectId].status = ProjectStatus.Suspended;
        emit ProjectSuspended(_projectId, _reason);
    }
    
    /**
     * @dev Get project details
     */
    function getProject(uint256 _projectId) external view returns (Project memory) {
        return projects[_projectId];
    }
    
    /**
     * @dev Get all MRV data for a project
     */
    function getProjectMRVData(uint256 _projectId) external view returns (MRVData[] memory) {
        return projectMRVData[_projectId];
    }
    
    /**
     * @dev Get projects by owner
     */
    function getProjectsByOwner(address _owner) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count projects owned by the address
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].owner == _owner) {
                count++;
            }
        }
        
        // Collect project IDs
        uint256[] memory ownerProjects = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].owner == _owner) {
                ownerProjects[index] = projectIds[i];
                index++;
            }
        }
        
        return ownerProjects;
    }
    
    /**
     * @dev Get projects by status
     */
    function getProjectsByStatus(ProjectStatus _status) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count projects with the specified status
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].status == _status) {
                count++;
            }
        }
        
        // Collect project IDs
        uint256[] memory statusProjects = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].status == _status) {
                statusProjects[index] = projectIds[i];
                index++;
            }
        }
        
        return statusProjects;
    }
    
    /**
     * @dev Get total verified carbon sequestration across all projects
     */
    function getTotalVerifiedCarbon() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < projectIds.length; i++) {
            total += projects[projectIds[i]].verifiedCarbonSequestration;
        }
        return total;
    }
    
    /**
     * @dev Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return projectIds.length;
    }
}

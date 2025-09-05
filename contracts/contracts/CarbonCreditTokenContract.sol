// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ProjectContract.sol";

/**
 * @title CarbonCreditTokenContract
 * @dev ERC1155 contract for tokenized carbon credits from blue carbon projects
 */
contract CarbonCreditTokenContract is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    struct CarbonCreditToken {
        uint256 projectId;
        uint256 vintageYear;
        uint256 totalSupply;
        uint256 availableSupply;
        string metadataURI;
        bool retired;
        address projectOwner;
        uint256 mintTime;
    }
    
    // Project contract reference
    ProjectContract public projectContract;
    
    // Token storage
    mapping(uint256 => CarbonCreditToken) public carbonCredits;
    mapping(uint256 => mapping(address => uint256)) public retiredCredits;
    uint256 public nextTokenId = 1;
    uint256[] public tokenIds;
    
    // Marketplace functionality
    struct Listing {
        address seller;
        uint256 amount;
        uint256 pricePerToken; // in wei
        bool active;
    }
    
    mapping(uint256 => mapping(address => Listing)) public listings;
    
    // Events
    event CarbonCreditsIssued(uint256 indexed tokenId, uint256 indexed projectId, uint256 amount, uint256 vintageYear);
    event CarbonCreditsRetired(uint256 indexed tokenId, address indexed retiree, uint256 amount);
    event CarbonCreditsListed(uint256 indexed tokenId, address indexed seller, uint256 amount, uint256 price);
    event CarbonCreditsSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 amount, uint256 totalPrice);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    
    modifier onlyProjectContract() {
        require(msg.sender == address(projectContract), "Only project contract can call");
        _;
    }
    
    constructor(address _projectContract, string memory _baseURI) ERC1155(_baseURI) {
        projectContract = ProjectContract(_projectContract);
    }
    
    /**
     * @dev Issue carbon credits for a verified project
     * Called by the project contract when a project is verified
     */
    function issueCarbonCredits(
        uint256 _projectId,
        uint256 _carbonAmount,
        uint256 _vintageYear,
        address _projectOwner,
        string memory _metadataURI
    ) external onlyProjectContract returns (uint256) {
        require(_carbonAmount > 0, "Carbon amount must be greater than 0");
        require(_projectOwner != address(0), "Invalid project owner");
        
        uint256 tokenId = nextTokenId++;
        
        carbonCredits[tokenId] = CarbonCreditToken({
            projectId: _projectId,
            vintageYear: _vintageYear,
            totalSupply: _carbonAmount,
            availableSupply: _carbonAmount,
            metadataURI: _metadataURI,
            retired: false,
            projectOwner: _projectOwner,
            mintTime: block.timestamp
        });
        
        tokenIds.push(tokenId);
        
        // Mint tokens to project owner
        _mint(_projectOwner, tokenId, _carbonAmount, "");
        
        emit CarbonCreditsIssued(tokenId, _projectId, _carbonAmount, _vintageYear);
        return tokenId;
    }
    
    /**
     * @dev Retire carbon credits (remove from circulation)
     */
    function retireCredits(uint256 _tokenId, uint256 _amount) external {
        require(balanceOf(msg.sender, _tokenId) >= _amount, "Insufficient balance");
        require(!carbonCredits[_tokenId].retired, "Credits already retired");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Burn the tokens
        _burn(msg.sender, _tokenId, _amount);
        
        // Update available supply
        carbonCredits[_tokenId].availableSupply -= _amount;
        
        // Track retired credits per address
        retiredCredits[_tokenId][msg.sender] += _amount;
        
        emit CarbonCreditsRetired(_tokenId, msg.sender, _amount);
    }
    
    /**
     * @dev List carbon credits for sale
     */
    function listCreditsForSale(
        uint256 _tokenId,
        uint256 _amount,
        uint256 _pricePerToken
    ) external {
        require(balanceOf(msg.sender, _tokenId) >= _amount, "Insufficient balance");
        require(_amount > 0, "Amount must be greater than 0");
        require(_pricePerToken > 0, "Price must be greater than 0");
        require(!carbonCredits[_tokenId].retired, "Credits are retired");
        
        listings[_tokenId][msg.sender] = Listing({
            seller: msg.sender,
            amount: _amount,
            pricePerToken: _pricePerToken,
            active: true
        });
        
        emit CarbonCreditsListed(_tokenId, msg.sender, _amount, _pricePerToken);
    }
    
    /**
     * @dev Buy carbon credits from a listing
     */
    function buyCredits(uint256 _tokenId, address _seller, uint256 _amount) 
        external payable nonReentrant {
        Listing storage listing = listings[_tokenId][_seller];
        require(listing.active, "Listing not active");
        require(listing.amount >= _amount, "Insufficient amount in listing");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 totalPrice = listing.pricePerToken * _amount;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update listing
        listing.amount -= _amount;
        if (listing.amount == 0) {
            listing.active = false;
        }
        
        // Transfer tokens
        safeTransferFrom(_seller, msg.sender, _tokenId, _amount, "");
        
        // Transfer payment to seller
        payable(_seller).transfer(totalPrice);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit CarbonCreditsSold(_tokenId, _seller, msg.sender, _amount, totalPrice);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _tokenId) external {
        require(listings[_tokenId][msg.sender].active, "No active listing");
        
        listings[_tokenId][msg.sender].active = false;
        emit ListingCancelled(_tokenId, msg.sender);
    }
    
    /**
     * @dev Get carbon credit details
     */
    function getCarbonCredit(uint256 _tokenId) external view returns (CarbonCreditToken memory) {
        return carbonCredits[_tokenId];
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 _tokenId, address _seller) external view returns (Listing memory) {
        return listings[_tokenId][_seller];
    }
    
    /**
     * @dev Get credits by project
     */
    function getCreditsByProject(uint256 _projectId) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count matching tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (carbonCredits[tokenIds[i]].projectId == _projectId) {
                count++;
            }
        }
        
        // Collect matching token IDs
        uint256[] memory projectTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (carbonCredits[tokenIds[i]].projectId == _projectId) {
                projectTokens[index] = tokenIds[i];
                index++;
            }
        }
        
        return projectTokens;
    }
    
    /**
     * @dev Get credits by vintage year
     */
    function getCreditsByVintage(uint256 _vintageYear) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count matching tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (carbonCredits[tokenIds[i]].vintageYear == _vintageYear) {
                count++;
            }
        }
        
        // Collect matching token IDs
        uint256[] memory vintageTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (carbonCredits[tokenIds[i]].vintageYear == _vintageYear) {
                vintageTokens[index] = tokenIds[i];
                index++;
            }
        }
        
        return vintageTokens;
    }
    
    /**
     * @dev Get total retired credits for an address
     */
    function getTotalRetiredCredits(address _account) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += retiredCredits[tokenIds[i]][_account];
        }
        return total;
    }
    
    /**
     * @dev Get total issued credits
     */
    function getTotalIssuedCredits() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += carbonCredits[tokenIds[i]].totalSupply;
        }
        return total;
    }
    
    /**
     * @dev Get total available (non-retired) credits
     */
    function getTotalAvailableCredits() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += carbonCredits[tokenIds[i]].availableSupply;
        }
        return total;
    }
    
    /**
     * @dev Override URI function to return custom metadata
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        return carbonCredits[_tokenId].metadataURI;
    }
    
    /**
     * @dev Check if token exists
     */
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return carbonCredits[_tokenId].mintTime > 0;
    }
    
    /**
     * @dev Update project contract address (only owner)
     */
    function updateProjectContract(address _newProjectContract) external onlyOwner {
        projectContract = ProjectContract(_newProjectContract);
    }
    
    /**
     * @dev Set new base URI (only owner)
     */
    function setURI(string memory _newURI) external onlyOwner {
        _setURI(_newURI);
    }
}

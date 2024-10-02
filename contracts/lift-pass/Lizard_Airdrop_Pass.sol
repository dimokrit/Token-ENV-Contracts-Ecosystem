// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

contract Lizard_Airdrop_Pass is UUPSUpgradeable, ERC721EnumerableUpgradeable, OwnableUpgradeable {

    uint public _nextId;
    uint public price;
    bool private transferAllowed;
    string private baseTokenURI;
    address private  founder;

    function initialize(string memory _baseTokenURI, uint _price) public initializer {
        __ERC721_init("Lizard Airdrop Pass", "LIZARDPASS");
        __Ownable_init();
        __UUPSUpgradeable_init();
        setBaseURI(_baseTokenURI);
        setPrice(_price);
        setTransferStatus(true);
        setFounder(msg.sender);
    }
    
    function mint() external virtual payable {
        require(balanceOf(msg.sender) == 0, "You already have a pass");
        require(msg.value >= price, "Fund amount is incorrect");
        _safeMint(msg.sender, _nextId);
        _nextId++;
    }

    function rawOwnerOf(uint tokenId) public virtual view returns (address) {
        if (_exists(tokenId)) {
            return ownerOf(tokenId);
        }
        return address(0);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        if (from != address(0) && to != address(0))
            require(transferAllowed, "Transfer is blocked");
    }

    //Admin Methods

    function setTransferStatus(bool enable) public virtual onlyOwner {
        transferAllowed = enable;
    }

    function setPrice(uint _price) public virtual onlyOwner {
        price = _price;
    }

    function setFounder(address _founder) public virtual onlyOwner {
        founder = _founder;
    }

    //NFT Metadata Methods

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721Upgradeable) returns (string memory) 
    {
        string memory _tokenURI = super.tokenURI(tokenId);
        return string(abi.encodePacked(_tokenURI, ".json"));
    }

    function setBaseURI(string memory baseURI) public virtual onlyOwner {
        baseTokenURI = baseURI;
    }


    // Withdraw

    function withdrawAll() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficent balance");
        _widthdraw(founder, address(this).balance);
    }

    function withdrawPart(uint256 amount) public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Insufficent balance");
        _widthdraw(founder, amount);
    }

    function _widthdraw(address _address, uint256 _amount) private {
        (bool success, ) = _address.call{ value: _amount }("");
        require(success, "Failed to widthdraw Ether");
    }

    //UUPS module required by openZ — Stops unauthorized upgrades
    function _authorizeUpgrade(address) internal virtual override onlyOwner{
    }
}
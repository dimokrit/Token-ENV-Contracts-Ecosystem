// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.12;

import "../lizard/Lizard.sol";
// Contract for testing upgradability 
contract Lizard_V2_Test is Lizard {

    // Test override function mint with new require (_approver == owner())
    function setApprover(address _approver) external override onlyOwner {
        require(_approver == owner(), "Approver have to be owner");
        _setApprover(_approver);
    }

    // Test new function getVersion
    function getVersion() external pure returns(string memory v){
        return("2.0");
    }
}
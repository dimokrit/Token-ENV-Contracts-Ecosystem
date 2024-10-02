// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../lift-pass/Lizard_Airdrop_Pass.sol";
// Contract for testing upgradability 
contract Lizard_Airdrop_Pass_V2_Test is Lizard_Airdrop_Pass {

    // Test override function mint with new require (price = 111)
    function mint() external virtual override payable {
        require(msg.value == 111, "Fund amount is incorrect");
        _safeMint(msg.sender, _nextId);
        _nextId++;
    }

    // Test new function getVersion
    function getVersion() external pure returns(string memory v){
        return("2.0");
    }
}
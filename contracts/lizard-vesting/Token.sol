// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint public maxSupply = 1000000000 * 10**18;

    constructor() ERC20("Lizard", "LIZ") {
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(amount + totalSupply() < maxSupply, "Exceeded max token amount");
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        require(totalSupply() - amount < 0, "Exceeded max token amount");
        _burn(account, amount);
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(string memory _name,string memory _simbol,uint256 _initialSupply) ERC20(_name,_simbol){
        _mint(msg.sender, _initialSupply);

    }
    
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ProductRegistry.sol";

contract TestProductRegistry {
  function testInitialProductCount() public {
    ProductRegistry productRegistry = ProductRegistry(DeployedAddresses.ProductRegistry());

    uint expected = 0;

    Assert.equal(productRegistry.productCount(), expected, "Product count should be 0 initially");
  }
}

const ProductRegistry = artifacts.require("ProductRegistry");

contract('ProductRegistry', function(accounts) {
  const [deployer, seller, buyer] = accounts;

  it("should create a product", async function() {
    const productRegistry = await ProductRegistry.deployed();

    const name = "Test Product";
    const photo = "http://example.com/photo.jpg";
    const description = "A product for testing";
    const price = web3.utils.toWei('1', 'ether');
    const sellerAddress = seller;

    await productRegistry.createProduct(name, photo, description, price, sellerAddress);

    const product = await productRegistry.products(1);

    assert.equal(product.name, name, "Product name mismatch");
    assert.equal(product.photo, photo, "Product photo mismatch");
    assert.equal(product.description, description, "Product description mismatch");
    assert.equal(product.price.toString(), price, "Product price mismatch");
    assert.equal(product.seller, sellerAddress, "Product seller mismatch");
    assert.equal(product.isDeleted, false, "Product should not be deleted");
    assert.equal(product.isReserved, false, "Product should not be reserved");
    assert.equal(product.isSold, false, "Product should not be sold");
  });

  it("should reserve a product", async function() {
    const productRegistry = await ProductRegistry.deployed();

    const productId = 1;
    const buyerAddress = buyer;
    const shippingInfo = "Test Buyer, 123 Test Street";

    const price = await productRegistry.products(productId).then(p => p.price.toString());

    await productRegistry.reserveProduct(productId, buyerAddress, shippingInfo, { from: buyer, value: price });

    const product = await productRegistry.products(productId);

    assert.equal(product.isReserved, true, "Product should be reserved");
    assert.equal(product.buyer, buyerAddress, "Product buyer mismatch");

    const order = await productRegistry.orders(1);

    console.log(`Expected amount: ${price}`);
    console.log(`Actual amount: ${order.amount.toString()}`);

    assert.equal(order.productId, productId, "Order product ID mismatch");
    assert.equal(order.buyer, buyerAddress, "Order buyer mismatch");
    assert.equal(order.amount.toString(), price, "Order amount mismatch");
    assert.equal(order.shippingInfo, shippingInfo, "Order shipping info mismatch");
  });

  it("should confirm product receipt", async function() {
    const productRegistry = await ProductRegistry.deployed();

    const orderId = 1;
    const buyerAddress = buyer;

    await productRegistry.confirmReceived(orderId, buyerAddress, { from: buyer });

    const product = await productRegistry.products(1);

    assert.equal(product.isSold, true, "Product should be sold");

    const order = await productRegistry.orders(orderId);
    assert.equal(order.isReleased, true, "Order funds should be released");
  });

  it("should cancel reservation", async function() {
    const productRegistry = await ProductRegistry.deployed();

    const productId = 2; // Create a new product for this test
    const buyerAddress = buyer;
    const shippingInfo = "Test Buyer, 123 Test Street";

    const name = "Test Product 2";
    const photo = "http://example.com/photo2.jpg";
    const description = "A product for testing cancellation";
    const price = web3.utils.toWei('1', 'ether');
    const sellerAddress = seller;

    await productRegistry.createProduct(name, photo, description, price, sellerAddress);

    await productRegistry.reserveProduct(productId, buyerAddress, shippingInfo, { from: buyer, value: price });

    await productRegistry.cancelReservation(2, buyerAddress, { from: buyer });

    const product = await productRegistry.products(productId);
    assert.equal(product.isReserved, false, "Product should not be reserved after cancellation");

    const order = await productRegistry.orders(2);
    assert.equal(order.isCanceled, true, "Order should be canceled");
  });
});

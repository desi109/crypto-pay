// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract ProductRegistry {
    struct Product {
        uint256 id;
        string name;
        string photo;
        string description;
        uint256 price; // Price in Wei
        address seller;
        bool isDeleted;
        bool isReserved; // track if the product is reserved
        bool isSold;
        address buyer;  // Track the buyer
    }

    struct Order {
        uint256 id;
        uint256 productId;
        address buyer;
        uint256 amount; // Use this for BigDecimal equivalent
        uint256 timestamp;
        bool isSend;
        bool isReleased;
        bool isPayed;
        bool isCanceled; // track if the product is reserved
        string shippingInfo;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    uint256 public productCount;
    uint256 public orderCount;
    address payable public escrow;

    event ProductCreated(
        uint256 id,
        string name,
        string photo,
        string description,
        uint256 price,
        address indexed seller
    );

    event ProductDeleted(uint256 id, address indexed seller);
    event ProductReserved(uint256 id, address indexed buyer);
    event ProductSold(uint256 id, address indexed buyer);
    event OrderCreated(uint256 id, uint256 productId, address indexed buyer);
    event FundsReleased(uint256 orderId);
    event FundsReturned(uint256 orderId);

    constructor() payable {
        escrow = payable(msg.sender);
    }

    function createProduct(
        string memory _name,
        string memory _photo,
        string memory _description,
        uint256 _price,
        address _sellerAddress
    ) public {
        require(bytes(_name).length > 0, "Name is required");
        require(bytes(_photo).length > 0, "Photo URL is required");
        require(bytes(_description).length > 0, "Description is required");
        require(_price > 0, "Price must be greater than zero");

        productCount++;
        products[productCount] = Product(
            productCount,
            _name,
            _photo,
            _description,
            _price,
            _sellerAddress,
            false,
            false,
            false,
            address(0) // Initialize buyer address to 0x0
        );

        emit ProductCreated(productCount, _name, _photo, _description, _price, _sellerAddress);
    }

    function deleteProduct(uint256 _id, address _sellerAddress) public {
        Product storage product = products[_id];
        require(product.seller == _sellerAddress, "Only the seller can delete the product");
        require(!product.isDeleted, "Product is already deleted");

        product.isDeleted = true;

        emit ProductDeleted(_id, _sellerAddress);
    }

    function reserveProduct(uint256  _id, address _buyer, string memory _shippingInfo, uint256 _amountWei) public payable {
        Product storage product = products[_id];
        require(product.id > 0 && product.id <= productCount, "Product does not exist");
        require(_amountWei == product.price, "Incorrect value sent");
        require(!product.isDeleted, "Product is deleted");
        require(!product.isReserved, "Product is already reserved");
        require(!product.isSold, "Product is already sold");

        product.isReserved = true;
        product.buyer = _buyer;
        orderCount++;
        orders[orderCount] = Order(orderCount, _id, _buyer, product.price, block.timestamp, false, false, false, false, _shippingInfo);

        emit ProductReserved(_id, _buyer);
        emit OrderCreated(orderCount, _id, _buyer);
    }

    function confirmSend(uint256 _orderId, address _sellerAddress) public {
        Order storage order = orders[_orderId];
        Product storage product = products[order.productId];
        require(order.id > 0 && order.id <= orderCount, "Order does not exist");
        require(product.seller == _sellerAddress, "Provided address is not the seller");
        require(!order.isSend, "Order already sent");

        order.isSend = true;
    }

    function confirmReceived(uint256 _orderId, address _buyerAddress, uint _amountWei, address _sellerAddress) public {
        Order storage order = orders[_orderId];
        require(order.id > 0 && order.id <= orderCount, "Order does not exist");
        require(order.buyer == _buyerAddress, "Provided address is not the buyer");
        require(!order.isReleased, "Funds already released");

        Product storage product = products[order.productId];
        require(product.buyer == _buyerAddress, "Provided address is not the buyer");

        order.isReleased = true;
        order.isPayed = true;
        product.isSold = true;

        (bool success) = payable(_sellerAddress).send(_amountWei);
        require(success, "Transfer failed.");

        emit ProductSold(product.id, _buyerAddress);
        emit FundsReleased(_orderId);
    }

    function cancelReservation(uint256 _orderId, address _buyerAddress, uint _amountWei) public {
        Order storage order = orders[_orderId];
        require(order.id > 0 && order.id <= orderCount, "Order does not exist");
        require(order.buyer == _buyerAddress, "Provided address is not the buyer");
        require(!order.isCanceled, "Order already canceled");

        Product storage product = products[order.productId];
        require(product.buyer == _buyerAddress, "Provided address is not the buyer");
        require(product.isReserved, "Product is not reserved");

        product.isReserved = false;
        order.isSend = false;
        order.isReleased = false;
        order.isCanceled = true;
        product.isSold = false;

        (bool success) = payable(_buyerAddress).send(_amountWei);
        require(success, "Transfer failed.");

        emit FundsReturned(_orderId);
    }

    function getProduct(uint256 _id) public view returns (Product memory) {
        require(products[_id].id > 0 && products[_id].id <= productCount, "Product does not exist");
        return products[_id];
    }

    function getProducts() public view returns (Product[] memory) {
        Product[] memory _products = new Product[](productCount);
        uint currentIndex = 0;

        for (uint i = 1; i <= productCount; i++) {
            if (!products[i].isDeleted && !products[i].isReserved && !products[i].isSold) {
                _products[currentIndex] = products[i];
                currentIndex++;
            }
        }

        Product[] memory filteredProducts = new Product[](currentIndex);
        for (uint j = 0; j < currentIndex; j++) {
            filteredProducts[j] = _products[j];
        }

        return filteredProducts;
    }

    function getOrder(uint256 _id) public view returns (Order memory) {
        require(orders[_id].id > 0 && orders[_id].id <= orderCount, "Order does not exist");
        return orders[_id];
    }

    function getOrders() public view returns (Order[] memory) {
        Order[] memory _orders = new Order[](orderCount);
        uint currentIndex = 0;

        for (uint i = 1; i <= orderCount; i++) {
            _orders[currentIndex] = orders[i];
            currentIndex++;
        }

        return _orders;
    }
}
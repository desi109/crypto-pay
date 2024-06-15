package org.shop.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;
import org.shop.contracts.ProductRegistry;
import org.shop.entities.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

import java.math.BigInteger;
import org.web3j.tx.gas.StaticGasProvider;

@Service
public class ProductService {

    private final Web3j web3j;
    private final ProductRegistry contract;
    private final String contractAddressForPay;
    private final TransactionManager transactionManager;
    private final ContractGasProvider contractGasProvider;
    private Map<LocalDate, BigDecimal> exchangeRatePerDate;

    public ProductService(
            @Value("${blockchain.network.url}") String networkUrl,
            @Value("${blockchain.contract.address.for.pay}") String contractAddressForPay,
            @Value("${blockchain.private.key}") String privateKey,
            @Value("${blockchain.contract.address}") String contractAddress,
            @Value("${blockchain.gas.limit}") String gasLimit,
            @Value("${blockchain.gas.price}") String gasPrice) throws Exception {
        this.contractAddressForPay = contractAddressForPay;
        this.web3j = Web3j.build(new HttpService(networkUrl));
        this.transactionManager = new RawTransactionManager(web3j, Credentials.create(privateKey));
        this.contractGasProvider = new StaticGasProvider(
                BigInteger.valueOf(Long.parseLong(gasPrice)),
                BigInteger.valueOf(Long.parseLong(gasLimit))
        );
        this.contract = ProductRegistry.load(contractAddress, web3j, transactionManager, contractGasProvider);

        exchangeRatePerDate = new HashMap<>();
        exchangeRatePerDate.put(LocalDate.now(), getExchangeRate());
    }

    public String getContractAddressForPay() {
        return contractAddressForPay;
    }

    public Web3j getWeb3j() {
        return web3j;
    }

    public ProductRegistry getContract() {
        return contract;
    }

    public TransactionManager getTransactionManager() {
        return transactionManager;
    }

    public ContractGasProvider getContractGasProvider() {
        return contractGasProvider;
    }

    public Map<LocalDate, BigDecimal> getExchangeRatePerDate() {
        return exchangeRatePerDate;
    }

    public Product getProductById(BigInteger id) throws Exception {
        ProductRegistry.Product product = contract.getProduct(id).send();

        Product newProduct = new Product(
                product.id,
                product.name,
                product.photo,
                product.description,
                String.valueOf(product.price),
                product.seller,
                product.isDeleted,
                product.isSold,
                product.isReserved,
                product.buyer);

        return newProduct;
    }

    public void createProduct(String name, String photo, String description, BigInteger weiValue, String sellerAddress) throws Exception {
        TransactionReceipt receipt = contract.createProduct(name, photo, description, weiValue, sellerAddress).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
        System.out.println("Product created with transaction receipt: " + receipt.getTransactionHash());
    }

    public void deleteProduct(BigInteger id, String sellerAddress) throws Exception {
        TransactionReceipt receipt = contract.deleteProduct(id, sellerAddress).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
    }

    public void reserveProduct(BigInteger id, BigInteger expectedValuePrice, String buyerAddress, String shippingName,
                               String shippingAddress, String transactionHash) throws Exception {
        ProductRegistry.Product product = contract.getProduct(id).send();
        if (product == null || product.isDeleted || product.isReserved || product.isSold) {
            throw new Exception("Product cannot be reserved");
        }

        String shippingInfo = "Name: " + shippingName + ", Address: " + shippingAddress;

        // Verify the transaction on-chain
        EthTransaction transactionResponse = web3j.ethGetTransactionByHash(transactionHash).send();

        boolean isTransactionValid = verifyTransaction(transactionResponse, buyerAddress, expectedValuePrice);
        if (!isTransactionValid) {
            throw new Exception("Transaction verification failed");
        }

        TransactionReceipt receipt = contract.reserveProduct(id, buyerAddress, shippingInfo, expectedValuePrice, expectedValuePrice).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
        System.out.println("Product reserved with transaction receipt: " + receipt.getTransactionHash());
    }

    private boolean verifyTransaction(EthTransaction transactionResponse, String fromAddress, BigInteger expectedValuePrice) {
        try {
            if (transactionResponse.getTransaction().isPresent()) {
                String transactionForm = transactionResponse.getTransaction().get().getFrom();
                BigInteger transactionValue = transactionResponse.getTransaction().get().getValue();
                return transactionForm.equalsIgnoreCase(fromAddress)
                        && transactionValue.equals(expectedValuePrice);
            } else {
                System.out.println("Transaction not found.");
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void confirmReceived(BigInteger orderId, String buyerAddress) throws Exception {
        ProductRegistry.Order order = contract.getOrder(orderId).send();
        ProductRegistry.Product product = contract.getProduct(order.productId).send();
        TransactionReceipt receipt = contract.confirmReceived(
                orderId, buyerAddress, order.amount, product.seller).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
    }

    public void confirmSend(BigInteger orderId, String sellerAddress) throws Exception {
        TransactionReceipt receipt = contract.confirmSend(orderId, sellerAddress).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
    }

    public void cancelReservation(BigInteger orderId, String buyerAddress) throws Exception {
        ProductRegistry.Order order = contract.getOrder(orderId).send();
        TransactionReceipt receipt = contract.cancelReservation(orderId, buyerAddress, order.amount).send();
        if (!receipt.isStatusOK()) {
            throw new Exception("Transaction failed");
        }
    }

    public BigDecimal getEurAmount(BigDecimal ethAmount) throws IOException {
        if (exchangeRatePerDate.entrySet().iterator().next().getKey().equals(LocalDateTime.now())) {
            exchangeRatePerDate = new HashMap<>();
            exchangeRatePerDate.put(LocalDate.now(), getExchangeRate());
        }
        return ethAmount.multiply(exchangeRatePerDate.entrySet().iterator().next().getValue())
                .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    public BigDecimal getEthAmount(BigDecimal eurAmount) throws IOException {
        if (exchangeRatePerDate.entrySet().iterator().next().getKey().equals(LocalDateTime.now())) {
            exchangeRatePerDate = new HashMap<>();
            exchangeRatePerDate.put(LocalDate.now(), getExchangeRate());
        }
        return eurAmount.divide(
                exchangeRatePerDate.entrySet().iterator().next().getValue(),
                18,
                BigDecimal.ROUND_HALF_UP);
    }

    private BigDecimal getExchangeRate() throws IOException {
        URL url = new URL("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");

        int status = con.getResponseCode();
        if (status != 200) {
            throw new IOException("Failed to get exchange rate");
        }

        BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
        String inputLine;
        StringBuilder content = new StringBuilder();
        while ((inputLine = in.readLine()) != null) {
            content.append(inputLine);
        }

        in.close();
        con.disconnect();

        JSONObject jsonResponse = new JSONObject(content.toString());
        return jsonResponse.getJSONObject("ethereum").getBigDecimal("eur");
    }

    public Page<Product> getAllProductsForSale(Integer page, Integer size, String buyerAddress) throws IOException {
        List<Product> products = getAllProducts();
        List<Product> filteredProductsForUser = new ArrayList<>();
        for (Product product : products) {
            if (!product.getSeller().equals(buyerAddress)) {
                filteredProductsForUser.add(product);
            }
        }
        int totalProducts = filteredProductsForUser.size();
        int start = (page - 1) * size;
        int end = Math.min(start + size, totalProducts);

        List<Product> paginatedProducts = filteredProductsForUser.subList(start, end);
        Pageable pageable = PageRequest.of(page - 1, size);
        return new PageImpl<>(paginatedProducts, pageable, totalProducts);
    }

    public List<Product> getAllProducts() throws IOException{
        List<ProductRegistry.Product> products = new ArrayList<>();
        List<Product> allProducts = new ArrayList<>();
        try {
            products = contract.getProducts().send();
            if (products.size() > 0) {
                products.forEach(product -> {
                    Product newProduct = new Product(
                            product.id,
                            product.name,
                            product.photo,
                            product.description,
                            String.valueOf(product.price),
                            product.seller,
                            product.isDeleted,
                            product.isSold,
                            product.isReserved,
                            product.buyer);

                    allProducts.add(newProduct);
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return allProducts;
    }

    public List<OrderResponse> getOrdersByBuyer(String buyerAddress) {
        List<OrderResponse> ordersResponse = new ArrayList<>();
        try {
            List<ProductRegistry.Order> allOrders = contract.getOrders().send();
            for (ProductRegistry.Order order : allOrders) {
                if (order.buyer.equals(buyerAddress)) {
                    ProductRegistry.Product product = contract.getProduct(order.productId).send();

                    OrderResponse orderResponse = new OrderResponse(
                            order.id,
                            new ProductResponse(product.id, product.name, product.photo, product.description, product.price),
                            product.price,
                            product.isReserved,
                            order.isSend,
                            order.isReleased,
                            order.isPayed,
                            order.isCanceled,
                            product.isDeleted,
                            order.shippingInfo,
                            order.buyer
                    );
                    ordersResponse.add(orderResponse);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ordersResponse;
    }

    public Page<OrderResponse> getOrdersByBuyerPerPage(String buyerAddress, Integer page, Integer size) {
        List<OrderResponse> orders = getOrdersByBuyer(buyerAddress);
        int totalProducts = orders.size();
        int start = (page - 1) * size;
        int end = Math.min(start + size, totalProducts);

        List<OrderResponse> paginatedOrders = orders.subList(start, end);
        Pageable pageable = PageRequest.of(page - 1, size);
        return new PageImpl<>(paginatedOrders, pageable, totalProducts);
    }

    public List<OrderResponse> getProductsBySeller(String sellerAddress) {
        List<OrderResponse> ordersResponse = new ArrayList<>();
        try {
            List<ProductRegistry.Order> allOrders = contract.getOrders().send();

            for (ProductRegistry.Order order : allOrders) {
                if (!order.isCanceled.booleanValue()) {
                Product product = getProductById(order.productId);
                if (product.getSeller().equals(sellerAddress)) {
                    OrderResponse orderResponse = new OrderResponse(
                            order.id,
                            new ProductResponse(
                                    product.getId(),
                                    product.getName(),
                                    product.getPhoto(),
                                    product.getDescription(),
                                    new BigInteger(product.getPrice())
                            ),
                            new BigInteger(product.getPrice()),
                            product.getReserved(),
                            order.isSend,
                            order.isReleased,
                            order.isCanceled,
                            order.isPayed,
                            product.getDeleted(),
                            order.shippingInfo,
                            order.buyer
                    );
                    ordersResponse.add(orderResponse);
                }
                }
            }

            List<Product> products = getAllProducts();
            for (Product product : products) {
                boolean isProductAdded = false;
                for (OrderResponse orderResponse : ordersResponse) {
                    if (orderResponse.product.id.equals(product.id)) {
                        isProductAdded = true;
                    }
                }

                if (product.getSeller().equals(sellerAddress) && !isProductAdded) {
                    OrderResponse orderResponse = new OrderResponse(
                            product.getId(),
                            new ProductResponse(
                                    product.getId(),
                                    product.getName(),
                                    product.getPhoto(),
                                    product.getDescription(),
                                    new BigInteger(product.getPrice())
                            ),
                            new BigInteger(product.getPrice()),
                            product.getReserved(),
                            false,
                            false,
                            false,
                            false,
                            product.getDeleted(),
                            "-",
                            "0x000"
                    );
                    ordersResponse.add(orderResponse);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return ordersResponse;
    }

    public Page<OrderResponse> getProductsBySellerPerPage(String sellerAddress, Integer page, Integer size) {
        List<OrderResponse> orders = getProductsBySeller(sellerAddress);
        int totalProducts = orders.size();
        int start = (page - 1) * size;
        int end = Math.min(start + size, totalProducts);

        List<OrderResponse> paginatedOrders = orders.subList(start, end);
        Pageable pageable = PageRequest.of(page - 1, size);
        return new PageImpl<>(paginatedOrders, pageable, totalProducts);
    }

    public static class OrderResponse {
        public BigInteger id;
        public ProductResponse product;
        public BigInteger total; // in wei
        public Boolean isProductReserved;
        public Boolean isOrderSend;
        public Boolean isOrderReleased;
        public Boolean isOrderPayed;
        public Boolean isOrderCanceled;
        public Boolean isProductDeleted;
        public String shippingInfo;
        public String buyer;

        public OrderResponse(BigInteger id, ProductResponse product, BigInteger total, Boolean isProductReserved,
                             Boolean isOrderSend, Boolean isOrderReleased, Boolean isOrderPayed, Boolean isOrderCanceled,
                             Boolean isProductDeleted, String shippingInfo, String buyer) {
            this.id = id;
            this.product = product;
            this.total = total;
            this.isProductReserved = isProductReserved;
            this.isOrderSend = isOrderSend;
            this.isOrderReleased = isOrderReleased;
            this.isOrderPayed = isOrderPayed;
            this.isOrderCanceled = isOrderCanceled;
            this.isProductDeleted = isProductDeleted;
            this.shippingInfo = shippingInfo;
            this.buyer = buyer;
        }
    }

    public static class ProductResponse {
        public BigInteger id;
        public String name;
        public String photo;
        public String description;
        public BigInteger price;

        public ProductResponse(BigInteger id, String name, String photo, String description, BigInteger price) {
            this.id = id;
            this.name = name;
            this.photo = photo;
            this.description = description;
            this.price = price;
        }
    }
}

package org.shop.controllers;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import org.shop.entities.Product;
import org.shop.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.web3j.utils.Convert;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productRegistryService;

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductDetail(@PathVariable BigInteger id) {
        try {
            Product product = productRegistryService.getProductById(id);
            if (product != null) {
                return ResponseEntity.ok(product);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam String buyerAddress) {
        try {
            List<Product> products = productRegistryService.getAllProducts();
            List<Product> filteredProductsForUser = new ArrayList<>();
            for (Product product : products) {
                if (product.getSeller() != buyerAddress) {
                    filteredProductsForUser.add(product);
                }
            }
            System.out.println("Products size: " + (filteredProductsForUser != null ? filteredProductsForUser.size() : "null"));
            if (filteredProductsForUser!= null && !filteredProductsForUser.isEmpty()) {
                return ResponseEntity.ok(filteredProductsForUser);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/allForSale")
    public ResponseEntity<Page<Product>> getAllProductsForSale(
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "9") Integer size,
            @RequestParam String buyerAddress) {
        try {
            Page<Product> productPage = productRegistryService.getAllProductsForSale(page, size, buyerAddress);
            return ResponseEntity.ok(productPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/addForSale")
    public ResponseEntity<String> createProduct(
            @RequestParam("name") String name,
            @RequestParam("photo")  String photo,
            @RequestParam("description")  String description,
            @RequestParam("price")  String price,
            @RequestParam("sellerAddress")  String sellerAddress) {
        try {
            BigDecimal ethAmount = productRegistryService.getEthAmount(new BigDecimal(price));
            BigInteger weiValue = Convert.toWei(ethAmount.toString(), Convert.Unit.ETHER).toBigInteger();

            productRegistryService.createProduct(name, photo, description, weiValue, sellerAddress);
            return ResponseEntity.ok("Product created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating product: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable BigInteger id,
            @RequestParam("sellerAddress")  String sellerAddress) {
        try {
            productRegistryService.deleteProduct(id, sellerAddress);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting product: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<String> reserveProduct(
            @PathVariable BigInteger id,
            @RequestParam("buyerAddress")  String buyerAddress,
            @RequestParam("shippingName") String shippingName,
            @RequestParam("shippingAddress")  String shippingAddress,
            @RequestParam("transactionHash") String transactionHash,
            @RequestParam("expectedValuePrice") String expectedValuePrice) {
        try {
            productRegistryService.reserveProduct(
                    id,
                    new BigInteger(expectedValuePrice),
                    buyerAddress,
                    shippingName,
                    shippingAddress,
                    transactionHash
            );

            return ResponseEntity.ok("Product reserved successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error reserving product: " + e.getMessage());
        }
    }

    @GetMapping("/getEscrowAddress")
    public ResponseEntity<String> getEscrowAddress(@RequestParam("escrow") String escrow) {
        try {
            String contractAddress = productRegistryService.getContractAddressForPay();
            return ResponseEntity.ok(contractAddress.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/myOrders")
    public ResponseEntity<List<ProductService.OrderResponse>> getMyOrders(@RequestParam String buyerAddress) {
        try {
            List<ProductService.OrderResponse> orders = productRegistryService.getOrdersByBuyer(buyerAddress);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/myOrdersPerPage")
    public ResponseEntity<Page<ProductService.OrderResponse>> getMyOrders(
            @RequestParam("buyerAddress") String buyerAddress,
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "9") Integer size) {
        try {
            Page<ProductService.OrderResponse> orders = productRegistryService.getOrdersByBuyerPerPage(
                    buyerAddress, page, size);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }


    @PostMapping("/confirmReceived/{orderId}")
    public ResponseEntity<String> confirmReceived(
            @PathVariable BigInteger orderId,
            @RequestParam("buyerAddress") String buyerAddress) {
        try {
            productRegistryService.confirmReceived(orderId, buyerAddress);
            return ResponseEntity.ok("Funds released successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error releasing funds: " + e.getMessage());
        }
    }

    @PostMapping("/confirmSend/{orderId}")
    public ResponseEntity<String> confirmSend(
            @PathVariable BigInteger orderId,
            @RequestParam("sellerAddress") String sellerAddress) {
        try {
            productRegistryService.confirmSend(orderId, sellerAddress);
            return ResponseEntity.ok("Order confirmed send successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error order confirmation for sending: " + e.getMessage());
        }
    }

    @PostMapping("/cancelReservation/{orderId}")
    public ResponseEntity<String> cancelReservation(
            @PathVariable BigInteger orderId,
            @RequestParam("buyerAddress") String buyerAddress) {
        try {
            productRegistryService.cancelReservation(orderId, buyerAddress);
            return ResponseEntity.ok("Reservation cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling reservation: " + e.getMessage());
        }
    }

    @GetMapping("/convertEuroToEth")
    public ResponseEntity<String> convertEuroToEth(@RequestParam("euroAmount") String euroAmount) {
        try {
            BigDecimal ethAmount = productRegistryService.getEthAmount(new BigDecimal(euroAmount));
            return ResponseEntity.ok(ethAmount.toString());
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/convertEthToEuro")
    public ResponseEntity<String> convertEthToEuro(@RequestParam("ethAmount") String ethAmount) {
        try {
            BigDecimal euroAmount = productRegistryService.getEurAmount(new BigDecimal(ethAmount));
            return ResponseEntity.ok(euroAmount.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/convertWeiToEuro")
    public ResponseEntity<String> convertWeiToEuro(@RequestParam("weiAmount") String weiAmount) {
        try {
            BigDecimal ethAmount = Convert.fromWei(weiAmount, Convert.Unit.ETHER);
            BigDecimal euroAmount = productRegistryService.getEurAmount(ethAmount);
            return ResponseEntity.ok(euroAmount.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/convertEthToWei")
    public ResponseEntity<String> convertEthToWei(@RequestParam("ethAmount") String ethAmount) {
        try {
            BigDecimal weiValue = Convert.toWei(ethAmount, Convert.Unit.ETHER);
            return ResponseEntity.ok(weiValue.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/convertWeiToEth")
    public ResponseEntity<String> convertWeiToEth(@RequestParam("weiAmount") String weiAmount) {
        try {
            BigDecimal ethValue = Convert.fromWei(weiAmount, Convert.Unit.ETHER);
            return ResponseEntity.ok(ethValue.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/myProducts")
    public ResponseEntity<List<ProductService.OrderResponse>> getMyProducts(@RequestParam String sellerAddress) {
        try {
            List<ProductService.OrderResponse> orders = productRegistryService.getProductsBySeller(sellerAddress);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/myProductsPerPage")
    public ResponseEntity<Page<ProductService.OrderResponse>> getMyProducts(
            @RequestParam("sellerAddress") String sellerAddress,
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "9") Integer size) {
        try {
            Page<ProductService.OrderResponse> orders = productRegistryService.getProductsBySellerPerPage(
                    sellerAddress, page, size);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}

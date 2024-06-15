package org.shop.entities;

import java.math.BigInteger;

public class Product {
    public BigInteger id;

    public String name;

    public String photo;

    public String description;

    public String price; // in wei

    public String seller;

    public Boolean isDeleted;

    public Boolean isSold;

    public Boolean isReserved;

    public String buyer;

    public Product() {
    }

    public Product(BigInteger id, String name, String photo, String description, String price, String seller,
                   Boolean isDeleted, Boolean isSold, Boolean isReserved, String buyer) {
        this.id = id;
        this.name = name;
        this.photo = photo;
        this.description = description;
        this.price = price;
        this.seller = seller;
        this.isDeleted = isDeleted;
        this.isSold = isSold;
        this.isReserved = isReserved;
        this.buyer = buyer;
    }

    public BigInteger getId() {
        return id;
    }

    public void setId(BigInteger id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getSeller() {
        return seller;
    }

    public void setSeller(String seller) {
        this.seller = seller;
    }

    public Boolean getDeleted() {
        return isDeleted;
    }

    public void setDeleted(Boolean deleted) {
        isDeleted = deleted;
    }

    public Boolean getSold() {
        return isSold;
    }

    public void setSold(Boolean sold) {
        isSold = sold;
    }

    public Boolean getReserved() {
        return isReserved;
    }

    public void setReserved(Boolean reserved) {
        isReserved = reserved;
    }

    public String getBuyer() {
        return buyer;
    }

    public void setBuyer(String buyer) {
        this.buyer = buyer;
    }
}
import { Component, OnInit } from '@angular/core';
import { MetaMaskService } from '../../services/metamask.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-sold-product-list',
  templateUrl: './sold-product-list.component.html',
  styleUrl: './sold-product-list.component.css'
})
export class SoldProductListComponent implements OnInit {
  products: any[] = [];
  account!: string;
  page: number = 1;
  size: number = 4;
  totalPages!: number;

  constructor(
    private orderService: OrderService,
    private metaMaskService: MetaMaskService,
    private productService: ProductService
  ) { }

  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
      this.getProductsPage();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }
  }

  getProductsPage(page: number = 1, size: number = 4) {
    this.orderService.getOrdersBySeller(this.account, page, size).subscribe(response => {
      this.products = response.content;
      this.totalPages = response.totalPages;
      this.products.forEach(product => this.convertPrices(product));
    });
  }

  deleteProduct(productId: number) {
    this.productService.deleteProduct(productId)
    .subscribe(
      response => {
        console.log(response); 
        window.location.reload();
      },
      error => {
        console.error('Failed to delete product', error);
        alert('Failed to delete product: ' + error.error);
      }
    );
  }

  convertPrices(order: any) {
    this.metaMaskService.convertWeiToEuro(order.product.price.toString()).subscribe(euro => {
      order.product.priceInEuro = euro;
    });

    this.metaMaskService.convertWeiToEth(order.product.price.toString()).subscribe(eth => {
      order.product.priceInEth = eth;
    });
  }

  sendOrder(productId: number) {
    this.orderService.sendOrder(productId, this.account)
    .subscribe(
      response => {
        console.log(response); 
        window.location.reload();
      },
      error => {
        console.error('Failed mark order as send', error);
        alert('Failed to mark order as send: ' + error.error);
      }
    );
  }

  getMyFunds(arg0: any) {
    throw new Error('Method not implemented.');
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.getProductsPage(this.page, this.size);
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.getProductsPage(this.page, this.size);
    }
  }
}
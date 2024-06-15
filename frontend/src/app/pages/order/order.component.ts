import { Component, OnInit } from '@angular/core';
import { MetaMaskService } from '../../services/metamask.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  orders: any[] = [];
  account!: string;
  page: number = 1;
  size: number = 4;
  totalPages!: number;

  constructor(
    private orderService: OrderService,
    private metaMaskService: MetaMaskService
  ) { }

  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
      console.log('Connected account:', this.account);
      this.getOrdersPage();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }
  }

  getOrdersPage(page: number = 1, size: number = 4) {
    this.orderService.getOrdersByBuyer(this.account, page, size).subscribe(response => {
      console.log('Response from API:', response);
      this.orders = response.content;
      this.totalPages = response.totalPages;
      this.orders.forEach(order => this.convertPrices(order));
    });
  }

  convertPrices(order: any) {
    this.metaMaskService.convertWeiToEuro(order.product.price.toString()).subscribe(euro => {
      order.product.priceInEuro = euro;
    });

    this.metaMaskService.convertWeiToEth(order.product.price.toString()).subscribe(eth => {
      order.product.priceInEth = eth;
    });
  }

  releaseFunds(orderId: number) {
    this.orderService.releaseFunds(orderId, this.account).subscribe(
      response => {
        console.log("Funds released successfully:" + response); 
        window.location.reload();
      },
      error => {
        console.error('Failed to release funds', error);
        alert('Failed to release funds: ' + error.error);
      }
    );
  }

  returnFunds(orderId: number) {
    this.orderService.returnFunds(orderId, this.account).subscribe(
      response => {
        console.log("Funds returned successfully: " + response); 
        window.location.reload();
      },
      error => {
        console.error('Failed to return funds', error);
        alert('Failed to return funds: ' + error.error);
      }
    );
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.getOrdersPage(this.page, this.size);
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.getOrdersPage(this.page, this.size);
    }
  }

  convertWeiToEuro(price: string): any {
    this.metaMaskService.convertWeiToEuro(price);
  }


  convertWeiToEth(price: string): any {
    this.metaMaskService.convertWeiToEth(price);
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  products: any[] = [];
  account!: string;
  page: number = 1;
  size: number = 4;
  totalPages!: number;

  constructor(
    private productService: ProductService,
    private metaMaskService: MetaMaskService
  ) {}


  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }

    this.getProductsPage();
  }

  update() {
    this.getProductsPage(this.page, this.size);
  }

  getProductsPage(page: number = 1, size: number = 4) {
    this.productService.getProductsPage(page, size, this.account).subscribe(response => {
      console.log('Response:', response);
      this.products = response.content;
      console.log('Products:', this.products);
      this.totalPages = response.totalPages;
    });
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
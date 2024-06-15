import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProductInfo } from '../../models/ProductInfo';
import { Router } from '@angular/router';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
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
      this.getProductsPage();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }
  }

  getProductsPage(page: number = 1, size: number = 4) {
    this.productService.getProductsPage(page, size, this.account).subscribe(response => {
      this.products = response.filter((product: { seller: string; isSold: any; }) => product.seller !== this.account && !product.isSold);
      this.totalPages = Math.ceil(response.length / size); // assuming the backend returns the total count in the response
    });
  }

  remove(arg0: any, _t14: any) {
    throw new Error('Method not implemented.');
  }

  delete(arg0: any, _t14: any) {
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
  /*page: any;
  private querySub: Subscription;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(() => {
      this.update();
    });
  }

  ngOnDestroy(): void {
    this.querySub.unsubscribe();
  }

  update() {
    if (this.route.snapshot.queryParamMap.get('page')) {
      const currentPage = +this.route.snapshot.queryParamMap.get('page');
      const size = +this.route.snapshot.queryParamMap.get('size');
      this.getProds(currentPage, size);
    } else {
      this.getProds();
    }
  }

  getProds(page: number = 1, size: number = 4) {
    this.productService.getAllProducts(page, size).subscribe(page => {
      this.page = page;
    });
  }
}*/

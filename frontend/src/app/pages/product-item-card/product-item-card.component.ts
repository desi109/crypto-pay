import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductInfo } from '../../models/ProductInfo';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-product-item-card',
  templateUrl: './product-item-card.component.html',
  styleUrls: ['./product-item-card.component.css']
})
export class ProductItemCardComponent implements OnInit {
  @Input() productInfo!: ProductInfo;
  priceInEuro!: string;

  constructor(private router: Router,
    private metaMaskService: MetaMaskService
  ) {}

  ngOnInit() {
    console.log('Product Info:', this.productInfo);          
    this.metaMaskService.convertWeiToEuro(this.productInfo.price).subscribe(
      (price: string) => {
        this.priceInEuro = price;
      },
      (error) => {
        console.error('Error converting WEI to EUR', error);
      }
    );  }

  seeDetailsProduct() {
    this.router.navigate([`/product/${this.productInfo.id}`]);
  }
}
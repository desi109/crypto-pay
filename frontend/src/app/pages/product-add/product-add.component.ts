import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-product-add',
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.css'
})
export class ProductAddComponent {
  account!: string;
  name!: string;
  price!: string;
  photo!: string;
  description!: string;

  constructor(
    private productService: ProductService,
    private router: Router,
    private metaMaskService: MetaMaskService
  ) {}

  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }
  }

  async onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }
  
    try {      
      const productData = {
        name: this.name,
        photo: this.photo,
        description: this.description,
        price: this.price.toString(),
        sellerAddress: this.account
      };        

      this.productService.createProduct(productData).subscribe(
        response => {
            console.log(response); // Log the response if needed
            this.router.navigate(['/products/all']);
        },
        error => {
            console.error('Failed to add product for sale', error);
            alert('Failed to add product for sale: ' + error.error);
        }
      );
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      alert('Please connect to MetaMask');
    }
  }
  
}
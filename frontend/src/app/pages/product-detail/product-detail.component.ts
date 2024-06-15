import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductInfo } from '../../models/ProductInfo';
import { MetaMaskService } from '../../services/metamask.service';
import { ShippingInfo } from '../../models/ShippingInfo';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: ProductInfo = new ProductInfo();
  shippingInfo: ShippingInfo = { name: '', address: '' };
  buyerAddress!: string;
  account!: string;
  priceInEth!: string;
  priceInEuro!: string;
  escrowAddress: string = '';

  constructor(
    private productService: ProductService,
    private metaMaskService: MetaMaskService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }   

    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductById(productId).subscribe(async product => {
        this.product = product;
        
        const ethAmount = await this.metaMaskService.convertWeiToEth(this.product.price).toPromise() as string;
        console.log("Convert " + this.product.price + " WEI to " + ethAmount + " ETH");
        this.priceInEth = ethAmount;

        const euroAmount = await this.metaMaskService.convertWeiToEuro(this.product.price).toPromise() as string;
        console.log("Convert " + ethAmount + " ETH to " + euroAmount + " EURO");
        this.priceInEuro = euroAmount;

        const escrow = await this.metaMaskService.getEscrowAddress(this.product.price).toPromise() as string;
        this.escrowAddress = escrow;
        console.log("Escrow address: " + this.escrowAddress); 
      });
    }
  }

  async buyProduct() {
    try {
      const transactionHash = await this.metaMaskService.sendTransaction(
        this.account, this.escrowAddress, this.product.price) as string;
      console.log("TransactionHash: " + transactionHash); 

      const orderData = {
        productId: this.product.id,
        buyerAddress: this.account,
        shippingName: this.shippingInfo.name,
        shippingAddress: this.shippingInfo.address,
        transactionHash: transactionHash,
        expectedValuePrice: this.product.price
      };
    
      this.productService.buyProduct(orderData).subscribe(
        response => {
          console.log(response); 
          this.router.navigate(['/myOrders']);
        },
        error => {
          console.error('Failed to add product for sale', error);
          alert('Failed to add product for sale: ' + error.error);
        }
      );
    } catch (error) {
      console.error('Failed to complete transaction', error);
      alert('Failed to complete transaction: ' + error);
    }
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { apiUrl } from '../../environments/environment';
import { ProductInfo } from '../models/ProductInfo';


@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`);
  }

  getProductsPage(page: number, size: number, buyerAddress: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/allForSale?page=${page}&size=${size}`, {
      params: {
        buyerAddress: buyerAddress
      }
    });
  }

  getProduct(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createProduct(product: any): Observable<any> {
    const params = new HttpParams()
        .set('name', product.name)
        .set('photo', product.photo)
        .set('description', product.description)
        .set('price', product.price) 
        .set('sellerAddress', product.sellerAddress);

        return this.http.post(`${this.apiUrl}/addForSale`, null, {
          params,
          responseType: 'text' // Expect the response as text
      });
}

  buyProduct(orderData: any): Observable<any> {
    const params = new HttpParams()
    .set('buyerAddress', orderData.buyerAddress)
    .set('shippingName', orderData.shippingName)
    .set('shippingAddress', orderData.shippingAddress)
    .set('transactionHash', orderData.transactionHash)
    .set('expectedValuePrice', orderData.expectedValuePrice);

    return this.http.post(`${this.apiUrl}/${orderData.productId}/reserve`, null, {
      params,
      responseType: 'text' // Expect the response as text
    });
  }

  deleteProduct(productId: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${productId}`);
  }

  getProductById(id: string): Observable<ProductInfo> {
    return this.http.get<ProductInfo>(`${this.apiUrl}/${id}`);
  }
}
 
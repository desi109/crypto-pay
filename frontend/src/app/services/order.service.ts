import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getOrdersByBuyer(buyerAddress: string, page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/myOrdersPerPage`, {
      params: {
        buyerAddress: buyerAddress,
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  getOrdersBySeller(sellerAddress: string, page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/myProductsPerPage`, {
      params: {
        sellerAddress: sellerAddress,
        page: page.toString(),
        size: size.toString()
      }
    });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  releaseFunds(orderId: number, buyerAddress: string): Observable<any> {
    const params = new HttpParams()
    .set('buyerAddress', buyerAddress);

    return this.http.post(`${this.apiUrl}/confirmReceived/${orderId}`, null, {
      params,
      responseType: 'text' // Expect the response as text
    });
  }

  sendOrder(orderId: number, sellerAddress: string): Observable<any> {
    const params = new HttpParams()
    .set('sellerAddress', sellerAddress);

    return this.http.post(`${this.apiUrl}/confirmSend/${orderId}`, null, {
      params,
      responseType: 'text' // Expect the response as text
    });
  }

  returnFunds(orderId: number, buyerAddress: string): Observable<any> {
    const params = new HttpParams()
    .set('buyerAddress', buyerAddress);

    return this.http.post(`${this.apiUrl}/cancelReservation/${orderId}`, null, {
      params,
      responseType: 'text' // Expect the response as text
    });
  }
}

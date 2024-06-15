import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { BehaviorSubject, Observable, catchError, map, of, switchMap } from 'rxjs';
import moment from 'moment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { apiUrl } from '../../environments/environment';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class MetaMaskService {

  private apiUrl = `${apiUrl}/products`;

  private web3!: Web3;
  private accounts: string[] = [];
  private accountSubject = new BehaviorSubject<string | null>(null);
  public account$: Observable<string | null> = this.accountSubject.asObservable();
  private exchangeRatePerDate: { [key: string]: number } = {};

  constructor(private http: HttpClient) {
    if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
      this.web3 = new Web3(window.ethereum || window.web3.currentProvider);
      this.listenForAccountChanges();
      this.listenForChainChanges();
    } else {
      console.warn('MetaMask is not installed');
    }
  }

  private getExchangeRate(): Observable<number> {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur';
    return this.http.get<{ ethereum: { eur: number } }>(url).pipe(
      map(response => response.ethereum.eur)
    );
  }

  private getOrFetchExchangeRate(): Observable<number> {
    const today = moment().format('YYYY-MM-DD');

    if (this.exchangeRatePerDate[today]) {
      return of(this.exchangeRatePerDate[today]);
    } else {
      return this.getExchangeRate().pipe(
        switchMap(rate => {
          this.exchangeRatePerDate = {}; // Clear old rates
          this.exchangeRatePerDate[today] = rate;
          return of(rate);
        }),
        catchError(error => {
          console.error('Error fetching exchange rate', error);
          return of(0); // Handle the error case appropriately
        })
      );
    }
  }

  getEscrowAddress(escrow: string): Observable<string> {
    const params = new HttpParams()
    .set('escrow', escrow);
    return this.http.get(`${this.apiUrl}/getEscrowAddress`, { params, responseType: 'text' });
  }

  async sendTransaction(fromAddress: string, toAddress: string, weiValue: string): Promise<string> {
    const transactionParameters = {
      to: toAddress,
      from: fromAddress,
      value: weiValue,
      gas: '6721975'
  };
    
    const result = await this.web3.eth.sendTransaction(transactionParameters);
    return result.transactionHash.toString();
  }

  private listenForAccountChanges() {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length > 0) {
        this.accountSubject.next(accounts[0]);
      } else {
        this.accountSubject.next(null); // No accounts connected
      }
    });
  }

  private listenForChainChanges() {
    window.ethereum.on('chainChanged', () => {
      window.location.reload(); // Refresh the page to handle chain changes
    });
  }

  async connectWallet(): Promise<string> {
    try {
        this.accounts = await this.web3.eth.requestAccounts();
        this.accountSubject.next(this.accounts[0]);
        
        // Log the connected network
        const chainId = await this.web3.eth.getChainId();
        console.log('Connected to chain:', chainId);
        
        return this.accounts[0]; // Return the connected account
    } catch (error) {
        console.error('User denied account access');
        throw error;
    }
}

  async isMetaMaskConnected(): Promise<boolean> {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts && accounts.length > 0;
    }
    return false;
  }

  getAccount(): string {
    return this.accounts ? this.accounts[0] : '';
  }

  toWei(value: string, unit: any = 'ether'): string {
    return Web3.utils.toWei(value, unit);
  }

  async getAccountBalance(address: string): Promise<string> {
    const balanceWei = await this.web3.eth.getBalance(address);
    const balanceEur = parseFloat(this.web3.utils.fromWei(balanceWei, 'ether')).toFixed(4);
    return balanceEur; 
  }

  async getAccountBalanceInEur(address: string): Promise<string> {
    const balanceEth = await this.getAccountBalance(address);
    return new Promise((resolve, reject) => {
      this.getOrFetchExchangeRate().subscribe(
        rate => {
          const balanceEur = (parseFloat(balanceEth) * rate).toFixed(2);
          resolve(balanceEur);
        },
        error => {
          reject('Error fetching exchange rate');
        }
      );
    });
  }

  async getChainName(): Promise<string> {
    if (typeof window.ethereum !== 'undefined') {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return this.mapChainIdToName(chainId);
    }
    return '';
  }

  private mapChainIdToName(chainId: string): string {
    const chainMap: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x2a': 'Kovan Testnet',
      '0x539': 'Ganache',
      '0x38': 'Binance Smart Chain'
    };
    return chainMap[chainId] || 'Unknown Network';
  }

  convertEuroToEth(euroAmount: string): Observable<string> {
    const params = new HttpParams()
    .set('euroAmount', euroAmount);

    return this.http.get<string>(`${this.apiUrl}/convertEuroToEth`, {params});
  }

  convertEthToEuro(ethAmount: string): Observable<string> {
    const params = new HttpParams()
    .set('ethAmount', ethAmount);

    return this.http.get<string>(`${this.apiUrl}/convertEthToEur`, {params});
  }

  convertWeiToEuro(weiAmount: string): Observable<string> {
    const params = new HttpParams()
    .set('weiAmount', weiAmount);

    return this.http.get<string>(`${this.apiUrl}/convertWeiToEuro`, {params});
  }

  convertEthToWei(ethAmount: string): Observable<string> {
    const params = new HttpParams()
    .set('ethAmount', ethAmount);

    return this.http.get<string>(`${this.apiUrl}/convertEthToWei`, {params});
  }

  convertWeiToEth(weiAmount: string): Observable<string> {
    const params = new HttpParams()
    .set('weiAmount', weiAmount);

    return this.http.get<string>(`${this.apiUrl}/convertWeiToEth`, {params});
  }
}



import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  accountSubscription: Subscription = new Subscription();
  isWalletConnected = false;
  walletAddress: string = '';
  chainName: string = '';
  ethBalance: string = '';
  eurBalance: string = '';
  dropdownOpen = false;

  constructor(
    private router: Router,
    private metaMaskService: MetaMaskService
  ) { }

  ngOnInit() {
    this.checkMetaMaskConnection();

    this.accountSubscription = this.metaMaskService.account$.subscribe(async (account: string | null) => {
      if (account) {
        this.isWalletConnected = true;
        this.walletAddress = this.formatWalletAddress(account);
        this.chainName = await this.metaMaskService.getChainName();
        this.ethBalance = await this.metaMaskService.getAccountBalance(account);
        this.eurBalance = await this.metaMaskService.getAccountBalanceInEur(account);
      } else {
        this.isWalletConnected = false;
        this.walletAddress = '';
        this.chainName = '';
        this.ethBalance = '';
        this.eurBalance = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }

  async checkMetaMaskConnection() {
    try {
      this.isWalletConnected = await this.metaMaskService.isMetaMaskConnected();
      if (this.isWalletConnected) {
        const address = this.metaMaskService.getAccount();
        if (address) {
          this.walletAddress = this.formatWalletAddress(address);
          this.chainName = await this.metaMaskService.getChainName();
          this.ethBalance = await this.metaMaskService.getAccountBalance(address);
          
          this.metaMaskService.convertEthToEuro(this.ethBalance).subscribe(
            (eurBalance: string) => {
              console.log('EUR balance:', eurBalance);
              this.eurBalance = eurBalance;
            },
            (error) => {
              console.error('Error converting ETH to EUR', error);
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
    }
  }

  async connectToMetaMask() {
    try {
      const address = await this.metaMaskService.connectWallet();
      if (address) {
        this.isWalletConnected = true;
        this.walletAddress = this.formatWalletAddress(address);
        this.chainName = await this.metaMaskService.getChainName();
        this.ethBalance = await this.metaMaskService.getAccountBalance(address);
        
        this.metaMaskService.convertEthToEuro(this.ethBalance).subscribe(
          (eurBalance: string) => {
            console.log('EUR balance:', eurBalance);
            this.eurBalance = eurBalance;
          },
          (error) => {
            console.error('Error converting ETH to EUR', error);
          }
        );

        console.log('MetaMask connected successfully');
      } else {
        console.error('Failed to connect to MetaMask');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  }

  async handleProductsClick(event: Event) {
    if (!this.isWalletConnected) {
      event.preventDefault();
      await this.connectToMetaMask();
    } else {
      this.router.navigate(['/products/all']);
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  private formatWalletAddress(address: string | null): string {
    if (address && address.length > 10) {
      return `${address.substring(0, 4)}..${address.substring(address.length - 3)}`;
    }
    return address || '';
  }
}

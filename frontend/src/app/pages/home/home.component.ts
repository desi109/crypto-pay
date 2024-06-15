import { Component, OnInit } from '@angular/core';
import { MetaMaskService } from '../../services/metamask.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  account!: string;

  constructor(
    private metaMaskService: MetaMaskService
  ) { }

  async ngOnInit() {
    try {
      this.account = await this.metaMaskService.connectWallet();
    } catch (error) {
      console.error('Could not connect to MetaMask', error);
    }
  }
}
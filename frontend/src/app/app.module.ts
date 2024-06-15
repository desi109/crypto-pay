import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardComponent } from './pages/card/card.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { OrderComponent } from './pages/order/order.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductEditComponent } from './pages/product-edit/product-edit.component';
import { ProductAddComponent } from './pages/product-add/product-add.component';
import { HomeComponent } from './pages/home/home.component';
import { SoldProductListComponent } from './pages/sold-product-list/sold-product-list.component';
import { MetaMaskService } from './services/metamask.service';
import { OrderService } from './services/order.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavigationComponent } from './parts/navigation/navigation.component';
import { FooterComponent } from './parts/footer/footer.component';
import { ProductItemCardComponent } from './pages/product-item-card/product-item-card.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    FooterComponent,
    CardComponent,
    ProductDetailComponent,
    OrderComponent,
    ProductListComponent,
    ProductEditComponent,
    ProductItemCardComponent,
    ProductAddComponent,
    HomeComponent,
    SoldProductListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    MetaMaskService, 
    OrderService,     
    provideHttpClient(withInterceptorsFromDi())  // Use provideHttpClient instead
],
bootstrap: [AppComponent],
schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }

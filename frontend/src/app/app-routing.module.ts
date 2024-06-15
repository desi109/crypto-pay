import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardComponent } from './pages/card/card.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { OrderComponent } from './pages/order/order.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductEditComponent } from './pages/product-edit/product-edit.component';
import { ProductAddComponent } from './pages/product-add/product-add.component';
import { HomeComponent } from './pages/home/home.component';
import { SoldProductListComponent } from './pages/sold-product-list/sold-product-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'myOrders', component: OrderComponent },
  { path: 'seller/products', component: SoldProductListComponent },
  { path: 'seller', redirectTo: 'seller/products', pathMatch: 'full' },
  { path: 'seller/products', component: SoldProductListComponent },
  { path: 'seller/product/:id/edit', component: ProductEditComponent },
  { path: 'seller/product/new', component: ProductAddComponent }, // Distinct path for adding a new product
  { path: 'products/all', component: CardComponent }, 
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

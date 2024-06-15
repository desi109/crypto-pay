import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductItemCardComponent } from './product-item-card.component';

describe('ProductItemCardComponent', () => {
  let component: ProductItemCardComponent;
  let fixture: ComponentFixture<ProductItemCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductItemCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductItemCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

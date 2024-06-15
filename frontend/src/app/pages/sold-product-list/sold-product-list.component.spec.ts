import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoldProductListComponent } from './sold-product-list.component';

describe('SoldProductListComponent', () => {
  let component: SoldProductListComponent;
  let fixture: ComponentFixture<SoldProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoldProductListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SoldProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

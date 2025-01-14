import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DislikedDebatesComponent } from './disliked-debates.component';

describe('DislikedDebatesComponent', () => {
  let component: DislikedDebatesComponent;
  let fixture: ComponentFixture<DislikedDebatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DislikedDebatesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DislikedDebatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

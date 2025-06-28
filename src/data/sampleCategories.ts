export interface Label {
  language: string;
  text: string;
}

export interface CategoryNode {
  code: string;
  labels: Label[];
  parent?: string;
}

export const sampleCategories: CategoryNode[] = [
  // Root level categories
  { 
    code: 'electronics', 
    labels: [
      { language: 'us', text: 'Electronics' },
      { language: 'se', text: 'Elektronik' }
    ], 
    parent: undefined 
  },
  { 
    code: 'clothing', 
    labels: [
      { language: 'us', text: 'Clothing' },
      { language: 'se', text: 'Kläder' }
    ], 
    parent: undefined 
  },
  { 
    code: 'home', 
    labels: [
      { language: 'us', text: 'Home & Garden' },
      { language: 'se', text: 'Hem & Trädgård' }
    ], 
    parent: undefined 
  },
  
  // Electronics subcategories
  { 
    code: 'phones', 
    labels: [
      { language: 'us', text: 'Phones' },
      { language: 'se', text: 'Telefoner' }
    ], 
    parent: 'electronics' 
  },
  { 
    code: 'computers', 
    labels: [
      { language: 'us', text: 'Computers' },
      { language: 'se', text: 'Datorer' }
    ], 
    parent: 'electronics' 
  },
  { 
    code: 'audio', 
    labels: [
      { language: 'us', text: 'Audio & Video' },
      { language: 'se', text: 'Ljud & Bild' }
    ], 
    parent: 'electronics' 
  },
  
  // Phone subcategories
  { 
    code: 'smartphones', 
    labels: [
      { language: 'us', text: 'Smartphones' },
      { language: 'se', text: 'Smartphones' }
    ], 
    parent: 'phones' 
  },
  { 
    code: 'accessories', 
    labels: [
      { language: 'us', text: 'Phone Accessories' },
      { language: 'se', text: 'Telefonaccessoarer' }
    ], 
    parent: 'phones' 
  },
  
  // Computer subcategories
  { 
    code: 'laptops', 
    labels: [
      { language: 'us', text: 'Laptops' },
      { language: 'se', text: 'Bärbara datorer' }
    ], 
    parent: 'computers' 
  },
  { 
    code: 'desktops', 
    labels: [
      { language: 'us', text: 'Desktop Computers' },
      { language: 'se', text: 'Stationära datorer' }
    ], 
    parent: 'computers' 
  },
  { 
    code: 'components', 
    labels: [
      { language: 'us', text: 'Computer Components' },
      { language: 'se', text: 'Datorkomponenter' }
    ], 
    parent: 'computers' 
  },
  
  // Clothing subcategories
  { 
    code: 'mens', 
    labels: [
      { language: 'us', text: "Men's Clothing" },
      { language: 'se', text: 'Herrkläder' }
    ], 
    parent: 'clothing' 
  },
  { 
    code: 'womens', 
    labels: [
      { language: 'us', text: "Women's Clothing" },
      { language: 'se', text: 'Damkläder' }
    ], 
    parent: 'clothing' 
  },
  { 
    code: 'kids', 
    labels: [
      { language: 'us', text: "Kids' Clothing" },
      { language: 'se', text: 'Barnkläder' }
    ], 
    parent: 'clothing' 
  },
  
  // Home subcategories
  { 
    code: 'furniture', 
    labels: [
      { language: 'us', text: 'Furniture' },
      { language: 'se', text: 'Möbler' }
    ], 
    parent: 'home' 
  },
  { 
    code: 'kitchen', 
    labels: [
      { language: 'us', text: 'Kitchen & Dining' },
      { language: 'se', text: 'Kök & Matsal' }
    ], 
    parent: 'home' 
  },
  { 
    code: 'garden', 
    labels: [
      { language: 'us', text: 'Garden' },
      { language: 'se', text: 'Trädgård' }
    ], 
    parent: 'home' 
  },
]; 
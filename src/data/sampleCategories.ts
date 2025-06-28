export interface Label {
  language: string;
  text: string;
}

export interface CategoryNode {
  code: string;
  labels: Label[];
  parent?: string;
  position?: { x: number; y: number };
}

export const sampleCategories: CategoryNode[] = [
  // Root level categories
  { 
    code: 'electronics', 
    labels: [
      { language: 'en', text: 'Electronics' },
      { language: 'sv', text: 'Elektronik' },
      { language: 'de', text: 'Elektronik' },
      { language: 'fr', text: 'Électronique' },
      { language: 'es', text: 'Electrónica' }
    ], 
    parent: undefined 
  },
  { 
    code: 'clothing', 
    labels: [
      { language: 'en', text: 'Clothing' },
      { language: 'sv', text: 'Kläder' },
      { language: 'de', text: 'Kleidung' },
      { language: 'fr', text: 'Vêtements' },
      { language: 'es', text: 'Ropa' }
    ], 
    parent: undefined 
  },
  { 
    code: 'home', 
    labels: [
      { language: 'en', text: 'Home & Garden' },
      { language: 'sv', text: 'Hem & Trädgård' },
      { language: 'de', text: 'Haus & Garten' },
      { language: 'fr', text: 'Maison & Jardin' },
      { language: 'es', text: 'Hogar & Jardín' }
    ], 
    parent: undefined 
  },
  
  // Electronics subcategories
  { 
    code: 'phones', 
    labels: [
      { language: 'en', text: 'Phones' },
      { language: 'sv', text: 'Telefoner' },
      { language: 'de', text: 'Telefone' },
      { language: 'fr', text: 'Téléphones' },
      { language: 'es', text: 'Teléfonos' }
    ], 
    parent: 'electronics' 
  },
  { 
    code: 'computers', 
    labels: [
      { language: 'en', text: 'Computers' },
      { language: 'sv', text: 'Datorer' },
      { language: 'de', text: 'Computer' },
      { language: 'fr', text: 'Ordinateurs' },
      { language: 'es', text: 'Computadoras' }
    ], 
    parent: 'electronics' 
  },
  { 
    code: 'audio', 
    labels: [
      { language: 'en', text: 'Audio & Video' },
      { language: 'sv', text: 'Ljud & Bild' },
      { language: 'de', text: 'Audio & Video' },
      { language: 'fr', text: 'Audio & Vidéo' },
      { language: 'es', text: 'Audio & Video' }
    ], 
    parent: 'electronics' 
  },
  
  // Phone subcategories
  { 
    code: 'smartphones', 
    labels: [
      { language: 'en', text: 'Smartphones' },
      { language: 'sv', text: 'Smartphones' },
      { language: 'de', text: 'Smartphones' },
      { language: 'fr', text: 'Smartphones' },
      { language: 'es', text: 'Smartphones' }
    ], 
    parent: 'phones' 
  },
  { 
    code: 'accessories', 
    labels: [
      { language: 'en', text: 'Phone Accessories' },
      { language: 'sv', text: 'Telefonaccessoarer' },
      { language: 'de', text: 'Telefonzubehör' },
      { language: 'fr', text: 'Accessoires téléphone' },
      { language: 'es', text: 'Accesorios telefónicos' }
    ], 
    parent: 'phones' 
  },
  
  // Computer subcategories
  { 
    code: 'laptops', 
    labels: [
      { language: 'en', text: 'Laptops' },
      { language: 'sv', text: 'Bärbara datorer' },
      { language: 'de', text: 'Laptops' },
      { language: 'fr', text: 'Ordinateurs portables' },
      { language: 'es', text: 'Laptops' }
    ], 
    parent: 'computers' 
  },
  { 
    code: 'desktops', 
    labels: [
      { language: 'en', text: 'Desktop Computers' },
      { language: 'sv', text: 'Stationära datorer' },
      { language: 'de', text: 'Desktop-Computer' },
      { language: 'fr', text: 'Ordinateurs de bureau' },
      { language: 'es', text: 'Computadoras de escritorio' }
    ], 
    parent: 'computers' 
  },
  { 
    code: 'components', 
    labels: [
      { language: 'en', text: 'Computer Components' },
      { language: 'sv', text: 'Datorkomponenter' },
      { language: 'de', text: 'Computer-Komponenten' },
      { language: 'fr', text: 'Composants informatiques' },
      { language: 'es', text: 'Componentes de computadora' }
    ], 
    parent: 'computers' 
  },
  
  // Clothing subcategories
  { 
    code: 'mens', 
    labels: [
      { language: 'en', text: "Men's Clothing" },
      { language: 'sv', text: 'Herrkläder' },
      { language: 'de', text: 'Herrenkleidung' },
      { language: 'fr', text: 'Vêtements hommes' },
      { language: 'es', text: 'Ropa de hombre' }
    ], 
    parent: 'clothing' 
  },
  { 
    code: 'womens', 
    labels: [
      { language: 'en', text: "Women's Clothing" },
      { language: 'sv', text: 'Damkläder' },
      { language: 'de', text: 'Damenkleidung' },
      { language: 'fr', text: 'Vêtements femmes' },
      { language: 'es', text: 'Ropa de mujer' }
    ], 
    parent: 'clothing' 
  },
  { 
    code: 'kids', 
    labels: [
      { language: 'en', text: "Kids' Clothing" },
      { language: 'sv', text: 'Barnkläder' },
      { language: 'de', text: 'Kinderkleidung' },
      { language: 'fr', text: 'Vêtements enfants' },
      { language: 'es', text: 'Ropa infantil' }
    ], 
    parent: 'clothing' 
  },
  
  // Home subcategories
  { 
    code: 'furniture', 
    labels: [
      { language: 'en', text: 'Furniture' },
      { language: 'sv', text: 'Möbler' },
      { language: 'de', text: 'Möbel' },
      { language: 'fr', text: 'Meubles' },
      { language: 'es', text: 'Muebles' }
    ], 
    parent: 'home' 
  },
  { 
    code: 'kitchen', 
    labels: [
      { language: 'en', text: 'Kitchen & Dining' },
      { language: 'sv', text: 'Kök & Matsal' },
      { language: 'de', text: 'Küche & Esszimmer' },
      { language: 'fr', text: 'Cuisine & Salle à manger' },
      { language: 'es', text: 'Cocina & Comedor' }
    ], 
    parent: 'home' 
  },
  { 
    code: 'garden', 
    labels: [
      { language: 'en', text: 'Garden' },
      { language: 'sv', text: 'Trädgård' },
      { language: 'de', text: 'Garten' },
      { language: 'fr', text: 'Jardin' },
      { language: 'es', text: 'Jardín' }
    ], 
    parent: 'home' 
  },
]; 
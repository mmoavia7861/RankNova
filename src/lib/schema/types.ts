export type SchemaType = 'Article' | 'Product' | 'LocalBusiness' | 'BreadcrumbList';

export interface ArticleFormData {
  headline: string;
  description: string;
  url: string;
  image: string;
  authorType: 'Person' | 'Organization';
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
  datePublished: string;
  dateModified: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  image: string;
  sku: string;
  brand: string;
  currency: string;
  price: string;
  availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock' | 'https://schema.org/PreOrder';
  itemCondition: 'https://schema.org/NewCondition' | 'https://schema.org/UsedCondition' | 'https://schema.org/RefurbishedCondition';
  url: string;
  includeRating: boolean;
  ratingValue?: string;
  reviewCount?: string;
}

export interface LocalBusinessFormData {
  name: string;
  businessType: string; // e.g. LocalBusiness, Restaurant, Store, Dentist
  description: string;
  url: string;
  telephone: string;
  image: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  priceRange: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbFormData {
  items: BreadcrumbItem[];
}

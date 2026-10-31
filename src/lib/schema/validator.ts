import { SchemaType } from './types';

export interface ValidationNotice {
  field: string;
  type: 'error' | 'warning';
  message: string;
}

export function validateSchemaInput(type: SchemaType, data: Record<string, any>): ValidationNotice[] {
  const notices: ValidationNotice[] = [];

  const isValidUrl = (urlStr: string) => {
    if (!urlStr) return false;
    try {
      const u = new URL(urlStr);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (type === 'Article') {
    if (!data.headline?.trim()) {
      notices.push({ field: 'headline', type: 'error', message: 'Article headline is required by Schema.org and Google.' });
    }
    if (!data.authorName?.trim()) {
      notices.push({ field: 'authorName', type: 'warning', message: 'Google strongly recommends specifying an Author for E-E-A-T signals.' });
    }
    if (!data.image?.trim()) {
      notices.push({ field: 'image', type: 'warning', message: 'Articles with images are eligible for Google Discover and enhanced rich results.' });
    } else if (!isValidUrl(data.image)) {
      notices.push({ field: 'image', type: 'error', message: 'Article image must be a valid HTTP or HTTPS URL.' });
    }
    if (data.url && !isValidUrl(data.url)) {
      notices.push({ field: 'url', type: 'error', message: 'Article page URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  if (type === 'Product') {
    if (!data.name?.trim()) {
      notices.push({ field: 'name', type: 'error', message: 'Product name is required.' });
    }
    if (!data.image?.trim()) {
      notices.push({ field: 'image', type: 'warning', message: 'Google Merchant and Rich Results require a high-resolution product image.' });
    } else if (!isValidUrl(data.image)) {
      notices.push({ field: 'image', type: 'error', message: 'Image must be a valid URL.' });
    }
    if (data.price?.trim()) {
      const priceNum = Number(data.price);
      if (!/^\d+(?:\.\d{1,2})?$/.test(data.price.trim()) || !Number.isFinite(priceNum) || priceNum < 0) {
        notices.push({ field: 'price', type: 'error', message: 'Price must be a valid positive number.' });
      }
    } else {
      notices.push({ field: 'price', type: 'warning', message: 'Price is recommended to qualify for rich product snippets in Google Search.' });
    }
    if (data.includeRating) {
      const rating = Number(data.ratingValue);
      const count = Number(data.reviewCount);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        notices.push({ field: 'ratingValue', type: 'error', message: 'Rating value must be between 1.0 and 5.0.' });
      }
      if (!Number.isInteger(count) || count < 1) {
        notices.push({ field: 'reviewCount', type: 'error', message: 'Review count must be at least 1.' });
      }
    }
  }

  if (type === 'LocalBusiness') {
    if (!data.name?.trim()) {
      notices.push({ field: 'name', type: 'error', message: 'Business name is required.' });
    }
    if (!data.streetAddress?.trim() && !data.addressLocality?.trim()) {
      notices.push({ field: 'streetAddress', type: 'warning', message: 'Postal address helps Google Maps and local pack positioning.' });
    }
    if (data.url && !isValidUrl(data.url)) {
      notices.push({ field: 'url', type: 'error', message: 'Website URL must be a valid HTTP or HTTPS URL.' });
    }
  }

  if (type === 'BreadcrumbList') {
    const items = data.items || [];
    if (items.length < 2) {
      notices.push({ field: 'items', type: 'warning', message: 'A breadcrumb trail typically contains at least 2 steps (e.g. Home > Category > Page).' });
    }
    items.forEach((item: any, idx: number) => {
      if (!item.name?.trim()) {
        notices.push({ field: `item-${idx}-name`, type: 'error', message: `Breadcrumb #${idx + 1} name is missing.` });
      }
      if (!item.url?.trim() || !isValidUrl(item.url)) {
        notices.push({ field: `item-${idx}-url`, type: 'error', message: `Breadcrumb #${idx + 1} URL must be a valid HTTP/HTTPS URL.` });
      }
    });
  }

  return notices;
}

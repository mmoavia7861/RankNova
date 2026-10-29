import {
  ArticleFormData,
  ProductFormData,
  LocalBusinessFormData,
  BreadcrumbFormData,
  SchemaType
} from './types';

export function buildArticleSchema(data: ArticleFormData): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline.trim(),
    description: data.description.trim() || undefined,
    image: data.image.trim() || undefined,
    mainEntityOfPage: data.url.trim() ? { '@type': 'WebPage', '@id': data.url.trim() } : undefined,
    datePublished: data.datePublished || undefined,
    dateModified: data.dateModified || data.datePublished || undefined
  };

  if (data.authorName.trim()) {
    schema.author = {
      '@type': data.authorType || 'Person',
      name: data.authorName.trim()
    };
  }

  if (data.publisherName.trim()) {
    schema.publisher = {
      '@type': 'Organization',
      name: data.publisherName.trim(),
      logo: data.publisherLogoUrl.trim()
        ? {
            '@type': 'ImageObject',
            url: data.publisherLogoUrl.trim()
          }
        : undefined
    };
  }

  // Remove undefined keys
  return JSON.parse(JSON.stringify(schema));
}

export function buildProductSchema(data: ProductFormData): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name.trim(),
    description: data.description.trim() || undefined,
    image: data.image.trim() || undefined,
    sku: data.sku.trim() || undefined,
    brand: data.brand.trim() ? { '@type': 'Brand', name: data.brand.trim() } : undefined
  };

  if (data.price.trim()) {
    schema.offers = {
      '@type': 'Offer',
      price: data.price.trim(),
      priceCurrency: data.currency.trim() || 'USD',
      availability: data.availability,
      itemCondition: data.itemCondition,
      url: data.url.trim() || undefined
    };
  }

  // Strictly only include rating if explicitly supplied with real numbers
  if (data.includeRating && data.ratingValue && data.reviewCount) {
    const val = Number.parseFloat(data.ratingValue);
    const count = Number.parseInt(data.reviewCount, 10);
    if (!Number.isNaN(val) && !Number.isNaN(count) && count > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: val,
        reviewCount: count
      };
    }
  }

  return JSON.parse(JSON.stringify(schema));
}

export function buildLocalBusinessSchema(data: LocalBusinessFormData): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': data.businessType || 'LocalBusiness',
    name: data.name.trim(),
    description: data.description.trim() || undefined,
    url: data.url.trim() || undefined,
    telephone: data.telephone.trim() || undefined,
    image: data.image.trim() || undefined,
    priceRange: data.priceRange.trim() || undefined
  };

  const hasAddress = Boolean(
    data.streetAddress.trim() ||
      data.addressLocality.trim() ||
      data.addressRegion.trim() ||
      data.postalCode.trim() ||
      data.addressCountry.trim()
  );

  if (hasAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: data.streetAddress.trim() || undefined,
      addressLocality: data.addressLocality.trim() || undefined,
      addressRegion: data.addressRegion.trim() || undefined,
      postalCode: data.postalCode.trim() || undefined,
      addressCountry: data.addressCountry.trim() || undefined
    };
  }

  if (data.latitude.trim() && data.longitude.trim()) {
    const lat = Number.parseFloat(data.latitude);
    const lng = Number.parseFloat(data.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: lat,
        longitude: lng
      };
    }
  }

  if (data.openingHours.trim()) {
    schema.openingHours = data.openingHours.trim();
  }

  return JSON.parse(JSON.stringify(schema));
}

export function buildBreadcrumbSchema(data: BreadcrumbFormData): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.items
      .filter(item => item.name.trim() && item.url.trim())
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name.trim(),
        item: item.url.trim()
      }))
  };

  return JSON.parse(JSON.stringify(schema));
}

export function formatJsonLd(obj: Record<string, any>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildArticleSchema,
  buildProductSchema,
  buildLocalBusinessSchema,
  buildBreadcrumbSchema
} from '../src/lib/schema/builder';
import { validateSchemaInput } from '../src/lib/schema/validator';

describe('Schema JSON-LD Builders & Validators', () => {
  test('builds valid Article schema with author and publisher', () => {
    const article = buildArticleSchema({
      headline: 'SEO Best Practices',
      description: 'A comprehensive guide',
      url: 'https://example.com/guide',
      image: 'https://example.com/banner.jpg',
      authorType: 'Person',
      authorName: 'Jane Doe',
      publisherName: 'RankNova',
      publisherLogoUrl: 'https://example.com/logo.png',
      datePublished: '2026-10-01',
      dateModified: '2026-10-29'
    });

    assert.equal(article['@context'], 'https://schema.org');
    assert.equal(article['@type'], 'Article');
    assert.equal(article.headline, 'SEO Best Practices');
    assert.equal(article.author['@type'], 'Person');
    assert.equal(article.author.name, 'Jane Doe');
  });

  test('builds valid Product schema with offer and rating', () => {
    const product = buildProductSchema({
      name: 'SEO Audit Pro',
      description: 'Audit tool suite',
      image: 'https://example.com/tool.jpg',
      sku: 'SKU-001',
      brand: 'RankNova',
      currency: 'USD',
      price: '29.00',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: 'https://example.com/buy',
      includeRating: true,
      ratingValue: '4.8',
      reviewCount: '45'
    });

    assert.equal(product['@type'], 'Product');
    assert.equal(product.name, 'SEO Audit Pro');
    assert.equal(product.offers['@type'], 'Offer');
    assert.equal(product.offers.price, '29.00');
    assert.equal(product.aggregateRating.ratingValue, 4.8);
  });

  test('validates required fields and reports warnings for missing fields', () => {
    const notices = validateSchemaInput('Article', {
      headline: '',
      authorName: '',
      image: 'invalid-url'
    });

    assert.ok(notices.some(n => n.field === 'headline' && n.type === 'error'));
    assert.ok(notices.some(n => n.field === 'authorName' && n.type === 'warning'));
    assert.ok(notices.some(n => n.field === 'image' && n.type === 'error'));
  });
});

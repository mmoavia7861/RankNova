import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Building2,
  Package,
  FileText,
  Navigation
} from 'lucide-react';
import { SchemaType, ArticleFormData, ProductFormData, LocalBusinessFormData, BreadcrumbFormData } from '../../../lib/schema/types';
import {
  buildArticleSchema,
  buildProductSchema,
  buildLocalBusinessSchema,
  buildBreadcrumbSchema,
  formatJsonLd
} from '../../../lib/schema/builder';
import { validateSchemaInput } from '../../../lib/schema/validator';
import { trackEvent } from '../../../lib/analytics';
import { AdSlot } from '../../layout/AdSlot';

export const SchemaGeneratorTool: React.FC = () => {
  const [activeType, setActiveType] = useState<SchemaType>('Article');
  const [copied, setCopied] = useState(false);

  // Form states
  const [articleData, setArticleData] = useState<ArticleFormData>({
    headline: 'Technical SEO Optimization in Modern Web Applications',
    description: 'A deep-dive tutorial into on-page SEO diagnostics, Core Web Vitals, and structured data.',
    url: 'https://ranknova.app/guides/technical-seo-optimization',
    image: 'https://ranknova.app/images/seo-guide-banner.jpg',
    authorType: 'Person',
    authorName: 'Sarah Jenkins',
    publisherName: 'RankNova',
    publisherLogoUrl: 'https://ranknova.app/assets/logo.png',
    datePublished: '2026-10-15',
    dateModified: '2026-10-29'
  });

  const [productData, setProductData] = useState<ProductFormData>({
    name: 'RankNova SEO Professional Suite',
    description: 'Comprehensive technical SEO diagnostic suite with SSRF-protected crawler and schema builder.',
    image: 'https://ranknova.app/images/product-suite.jpg',
    sku: 'RN-SEO-PRO',
    brand: 'RankNova',
    currency: 'USD',
    price: '49.00',
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    url: 'https://ranknova.app/pricing',
    includeRating: true,
    ratingValue: '4.9',
    reviewCount: '128'
  });

  const [localBusinessData, setLocalBusinessData] = useState<LocalBusinessFormData>({
    name: 'RankNova Digital Consulting',
    businessType: 'LocalBusiness',
    description: 'Expert technical SEO consulting and digital growth strategy.',
    url: 'https://ranknova.app',
    telephone: '+1-555-0199',
    image: 'https://ranknova.app/images/office.jpg',
    streetAddress: '100 Innovation Way',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94105',
    addressCountry: 'US',
    latitude: '37.7749',
    longitude: '-122.4194',
    openingHours: 'Mo-Fr 09:00-17:00',
    priceRange: '$$'
  });

  const [breadcrumbData, setBreadcrumbData] = useState<BreadcrumbFormData>({
    items: [
      { name: 'Home', url: 'https://ranknova.app/' },
      { name: 'SEO Tools', url: 'https://ranknova.app/tools' },
      { name: 'Schema JSON-LD Generator', url: 'https://ranknova.app/tools/schema-generator' }
    ]
  });

  // Calculate live schema JSON-LD
  const currentSchemaObj = React.useMemo(() => {
    switch (activeType) {
      case 'Article':
        return buildArticleSchema(articleData);
      case 'Product':
        return buildProductSchema(productData);
      case 'LocalBusiness':
        return buildLocalBusinessSchema(localBusinessData);
      case 'BreadcrumbList':
        return buildBreadcrumbSchema(breadcrumbData);
    }
  }, [activeType, articleData, productData, localBusinessData, breadcrumbData]);

  // Validate fields
  const validationNotices = React.useMemo(() => {
    const rawData =
      activeType === 'Article'
        ? articleData
        : activeType === 'Product'
        ? productData
        : activeType === 'LocalBusiness'
        ? localBusinessData
        : breadcrumbData;
    return validateSchemaInput(activeType, rawData);
  }, [activeType, articleData, productData, localBusinessData, breadcrumbData]);

  const jsonLdCode = formatJsonLd(currentSchemaObj);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(jsonLdCode);
    setCopied(true);
    trackEvent('schema_copied', { type: activeType });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(currentSchemaObj, null, 2)], {
      type: 'application/ld+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${activeType.toLowerCase()}-${Date.now()}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('report_downloaded', { type: 'schema_download' });
  };

  // Breadcrumb item helpers
  const handleAddBreadcrumb = () => {
    setBreadcrumbData({
      items: [...breadcrumbData.items, { name: '', url: '' }]
    });
  };

  const handleRemoveBreadcrumb = (index: number) => {
    setBreadcrumbData({
      items: breadcrumbData.items.filter((_, i) => i !== index)
    });
  };

  const handleUpdateBreadcrumb = (index: number, field: 'name' | 'url', val: string) => {
    const updated = [...breadcrumbData.items];
    updated[index][field] = val;
    setBreadcrumbData({ items: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Code2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Structured Data & Rich Snippets</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Schema JSON-LD Markup Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Produce valid, Schema.org-compliant JSON-LD structured data for Articles, Products, Local Businesses, and Breadcrumbs. Live syntax validation with direct Google Rich Results Test verification.
        </p>
      </div>

      {/* Template Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { type: 'Article' as SchemaType, icon: FileText, desc: 'Blog posts & news' },
          { type: 'Product' as SchemaType, icon: Package, desc: 'E-commerce & prices' },
          { type: 'LocalBusiness' as SchemaType, icon: Building2, desc: 'Stores, clinics & firms' },
          { type: 'BreadcrumbList' as SchemaType, icon: Navigation, desc: 'Navigation hierarchy' }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveType(tab.type)}
              className={`px-4 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                active
                  ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{tab.type}</div>
                <div className="text-[10px] text-slate-500">{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
              {activeType} Schema Properties
            </h2>

            {/* ARTICLE FORM */}
            {activeType === 'Article' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Headline / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={articleData.headline}
                    onChange={e => setArticleData({ ...articleData, headline: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Article Description</label>
                  <textarea
                    rows={2}
                    value={articleData.description}
                    onChange={e => setArticleData({ ...articleData, description: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Article Page URL</label>
                    <input
                      type="url"
                      value={articleData.url}
                      onChange={e => setArticleData({ ...articleData, url: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Featured Image URL</label>
                    <input
                      type="url"
                      value={articleData.image}
                      onChange={e => setArticleData({ ...articleData, image: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={articleData.authorName}
                      onChange={e => setArticleData({ ...articleData, authorName: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Publisher Name</label>
                    <input
                      type="text"
                      value={articleData.publisherName}
                      onChange={e => setArticleData({ ...articleData, publisherName: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date Published</label>
                    <input
                      type="date"
                      value={articleData.datePublished}
                      onChange={e => setArticleData({ ...articleData, datePublished: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date Modified</label>
                    <input
                      type="date"
                      value={articleData.dateModified}
                      onChange={e => setArticleData({ ...articleData, dateModified: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCT FORM */}
            {activeType === 'Product' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productData.name}
                    onChange={e => setProductData({ ...productData, name: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={productData.description}
                    onChange={e => setProductData({ ...productData, description: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Price (e.g. 49.00)</label>
                    <input
                      type="text"
                      value={productData.price}
                      onChange={e => setProductData({ ...productData, price: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={productData.currency}
                      onChange={e => setProductData({ ...productData, currency: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Availability</label>
                    <select
                      value={productData.availability}
                      onChange={e => setProductData({ ...productData, availability: e.target.value as any })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="https://schema.org/InStock">In Stock</option>
                      <option value="https://schema.org/OutOfStock">Out of Stock</option>
                      <option value="https://schema.org/PreOrder">Pre-Order</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={productData.brand}
                      onChange={e => setProductData({ ...productData, brand: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SKU / Identifier</label>
                    <input
                      type="text"
                      value={productData.sku}
                      onChange={e => setProductData({ ...productData, sku: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={productData.image}
                    onChange={e => setProductData({ ...productData, image: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Aggregate Rating Integrity Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Aggregate Rating</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productData.includeRating}
                        onChange={e => setProductData({ ...productData, includeRating: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-600 font-medium">Include Ratings</span>
                    </label>
                  </div>
                  {productData.includeRating && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Rating Value (1.0 - 5.0)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={productData.ratingValue || ''}
                          onChange={e => setProductData({ ...productData, ratingValue: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Review Count</label>
                        <input
                          type="number"
                          min="1"
                          value={productData.reviewCount || ''}
                          onChange={e => setProductData({ ...productData, reviewCount: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Important: Google Search quality guidelines prohibit fabricating fake reviews or ratings.
                  </p>
                </div>
              </div>
            )}

            {/* LOCAL BUSINESS FORM */}
            {activeType === 'LocalBusiness' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={localBusinessData.name}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, name: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business Type</label>
                    <select
                      value={localBusinessData.businessType}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, businessType: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="LocalBusiness">LocalBusiness (General)</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Store">Store / Retail</option>
                      <option value="ProfessionalService">Professional Service</option>
                      <option value="MedicalBusiness">Medical / Clinic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telephone</label>
                    <input
                      type="text"
                      value={localBusinessData.telephone}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, telephone: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Price Range</label>
                    <input
                      type="text"
                      value={localBusinessData.priceRange}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, priceRange: e.target.value })}
                      placeholder="$, $$, or $$$"
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={localBusinessData.streetAddress}
                    onChange={e => setLocalBusinessData({ ...localBusinessData, streetAddress: e.target.value })}
                    className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={localBusinessData.addressLocality}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, addressLocality: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State/Region</label>
                    <input
                      type="text"
                      value={localBusinessData.addressRegion}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, addressRegion: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={localBusinessData.postalCode}
                      onChange={e => setLocalBusinessData({ ...localBusinessData, postalCode: e.target.value })}
                      className="w-full bg-slate-50/60 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BREADCRUMB LIST FORM */}
            {activeType === 'BreadcrumbList' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Define your website navigation path steps. Google uses breadcrumb markup in place of raw URLs in search results.
                </p>

                <div className="space-y-2">
                  {breadcrumbData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2"
                    >
                      <span className="font-mono text-slate-500 font-bold px-1.5">
                        #{index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Page Name (e.g. Home)"
                          value={item.name}
                          onChange={e => handleUpdateBreadcrumb(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="url"
                          placeholder="https://example.com/step"
                          value={item.url}
                          onChange={e => handleUpdateBreadcrumb(index, 'url', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      {breadcrumbData.items.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBreadcrumb(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBreadcrumb}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Breadcrumb Step</span>
                </button>
              </div>
            )}
          </div>

          {/* Validation Notices */}
          {validationNotices.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">Schema Quality Check:</span>
              <ul className="space-y-1">
                {validationNotices.map((n, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-1.5 ${
                      n.type === 'error' ? 'text-rose-600' : 'text-amber-700'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{n.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live Code Preview Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Live JSON-LD Output</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                  title="Download .jsonld"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[440px] shadow-inner">
                <code>{jsonLdCode}</code>
              </pre>
            </div>

            {/* Google Rich Results Test Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/60 p-4 rounded-xl border border-blue-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900">
                  Google Rich Results Test
                </span>
                <p className="text-[11px] text-slate-600">
                  Validate this markup directly in Google's official structured data testing tool.
                </p>
              </div>
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors flex-shrink-0 cursor-pointer"
              >
                <span>Test in Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Rich Result Guarantee Disclaimer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Official Google Guidance:</strong> Google recommends JSON-LD for structured data. However, Google explicitly states that implementing valid markup does not guarantee a rich result will be displayed in search.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliant Ad Slot */}
      <AdSlot slotId="schema-generator-bottom" />
    </div>
  );
};

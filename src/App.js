import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  brandsSupplied,
  companyInfo,
  heroImage,
  leadConfig,
  productRange,
  trustedCategories,
  whyChooseUs,
} from './data';

const EMPTY_FORM = {
  name: '',
  company: '',
  phone: '',
  email: '',
  message: '',
};

const yearsInBusiness = new Date().getFullYear() - companyInfo.establishedYear;

const directionsLink = companyInfo.mapsUrl;

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(field.trim());
      field = '';
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some(Boolean)) {
      rows.push(row);
    }
  }

  const [headers = [], ...dataRows] = rows;

  return dataRows.map((dataRow, index) => {
    const product = headers.reduce((result, header, headerIndex) => {
      result[header] = dataRow[headerIndex] || '';
      return result;
    }, {});

    return {
      id: product.sku || `${product.name}-${index}`,
      ...product,
    };
  });
}

function productWhatsappHref(product) {
  const text = `Hello ${companyInfo.name}, I want pricing for: ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}`;
  return `https://wa.me/${companyInfo.whatsapp}?text=${encodeURIComponent(text)}`;
}

function productInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function BrandMark({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 9 L9 25 L25 41" />
      <path d="M55 9 L55 25 L39 41" />
      <path d="M25 41 L32 48" />
      <path d="M39 41 L32 48" />
      <path d="M32 48 L32 56" />
      <circle cx="9" cy="9" r="3.4" fill="var(--accent)" stroke="none" />
      <circle cx="55" cy="9" r="3.4" fill="var(--accent)" stroke="none" />
      <circle cx="32" cy="56" r="3.4" fill="var(--accent)" stroke="none" />
    </svg>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadState, setLoadState] = useState({ loading: true, error: '' });
  const [submitState, setSubmitState] = useState('');

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const response = await fetch(companyInfo.catalogueUrl);

        if (!response.ok) {
          throw new Error('Catalogue file could not be loaded.');
        }

        const csvText = await response.text();
        const catalogueProducts = parseCsv(csvText).filter((product) => product.name);

        setProducts(catalogueProducts);
        setLoadState({ loading: false, error: '' });
      } catch (error) {
        setLoadState({ loading: false, error: error.message });
      }
    }

    loadCatalogue();
  }, []);

  const categories = useMemo(() => {
    const productCategories = products
      .map((product) => product.category)
      .filter(Boolean)
      .sort();

    return ['All', ...Array.from(new Set(productCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatches =
        activeCategory === 'All' || product.category === activeCategory;
      const searchableText = [
        product.sku,
        product.name,
        product.category,
        product.brand,
        product.shortDescription,
        product.tags,
      ]
        .join(' ')
        .toLowerCase();

      return categoryMatches && searchableText.includes(normalizedQuery);
    });
  }, [activeCategory, products, query]);

  const selectedSummary = selectedProducts
    .map((product) => `${product.sku || product.id} - ${product.name}`)
    .join('\n');

  const mailtoLink = useMemo(() => {
    const subject = encodeURIComponent(
      `Product enquiry - ${companyInfo.name}`
    );
    const body = encodeURIComponent(
      [
        `Hello ${companyInfo.name},`,
        '',
        'I want pricing and availability for:',
        selectedSummary || 'Please share your catalogue details.',
        '',
        `Name: ${form.name}`,
        `Company: ${form.company}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        '',
        form.message,
      ].join('\n')
    );

    return `mailto:${companyInfo.email}?subject=${subject}&body=${body}`;
  }, [form, selectedSummary]);

  const whatsappLink = useMemo(() => {
    const text = encodeURIComponent(
      [
        `Hello ${companyInfo.name}, I want pricing for:`,
        selectedSummary || 'your product catalogue',
      ].join('\n')
    );

    return `https://wa.me/${companyInfo.whatsapp}?text=${text}`;
  }, [selectedSummary]);

  function handleSelectProduct(product) {
    setSelectedProducts((currentProducts) => {
      const exists = currentProducts.some((item) => item.id === product.id);

      if (exists) {
        return currentProducts;
      }

      return [...currentProducts, product];
    });

    document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleRemoveProduct(productId) {
    setSelectedProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId)
    );
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState('Sending enquiry...');

    if (leadConfig.web3formsAccessKey) {
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: leadConfig.web3formsAccessKey,
            subject: `Product enquiry - ${companyInfo.name}`,
            from_name: form.name,
            name: form.name,
            company: form.company,
            phone: form.phone,
            email: form.email,
            message: form.message,
            selected_products: selectedSummary || 'No specific products selected',
            page: window.location.href,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error('Web3Forms rejected the enquiry.');
        }

        setSubmitState('Enquiry sent. We will contact you shortly.');
        setForm(EMPTY_FORM);
        setSelectedProducts([]);
        return;
      } catch (error) {
        setSubmitState(
          'Automatic email failed. Opening your email app instead.'
        );
        window.location.href = mailtoLink;
        return;
      }
    }

    setSubmitState('Opening your email app with the enquiry details.');
    window.location.href = mailtoLink;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="wrap topbar__inner">
          <a className="brand" href="#top" aria-label={companyInfo.name}>
            <span className="brand__mark">
              <BrandMark />
            </span>
            <span>
              <strong>VINAYAK</strong>
              <small>Automation</small>
            </span>
          </a>

          <nav className="topbar__nav" aria-label="Primary navigation">
            <a href="#top" aria-current="page">Home</a>
            <a href="#catalogue">Catalogue</a>
            <a href="#enquiry">Enquiry</a>
            <a href="#contact">Contact</a>
          </nav>

          <a className="btn btn-primary" href="#enquiry">
            Request a quote
          </a>
        </div>
      </header>

      <main>
        <section className="hero wrap" id="top">
          <h1>
            <span style={{ display: 'block' }}>Automation parts,</span>
            <span style={{ display: 'block' }}>delivered right.</span>
          </h1>
          <p>
            Since {companyInfo.establishedYear}, {companyInfo.name} has supplied
            PLCs, VFDs, switchgear and critical automation spares to plants and
            panel builders across Delhi NCR - genuine parts, cross-brand
            sourcing, and a desk that answers the phone.
          </p>
          <div className="hero__actions">
            <a className="btn btn-primary" href="#catalogue">
              View product range
            </a>
            <a className="btn btn-ghost" href="#enquiry">
              Request a quote
            </a>
          </div>
        </section>

        <section className="wrap" style={{ paddingBottom: 72 }} aria-label="Vinayak Automation - company record">
          <div className="record">
            <header className="record-header">
              <span>Company record</span>
              <span>Est. {companyInfo.establishedYear}</span>
              <span>Delhi, IN</span>
              <span>Sheet 01</span>
            </header>
            <div className="grid-hairline record-stats">
              <div className="record-stat-cell">
                <div className="record-stat-label">01 &middot; Years in operation</div>
                <div className="record-stat-value">{yearsInBusiness}</div>
                <div className="record-stat-remark">Continuous supply since {companyInfo.establishedYear}</div>
              </div>
              <div className="record-stat-cell">
                <div className="record-stat-label">02 &middot; Business type</div>
                <div className="record-stat-value" style={{ fontSize: 20 }}>Supplier &amp; Trading Co.</div>
                <div className="record-stat-remark">GST {companyInfo.gstin}</div>
              </div>
              <div className="record-stat-cell">
                <div className="record-stat-label">03 &middot; Core categories</div>
                <div className="record-stat-value">{trustedCategories.length}</div>
                <div className="record-stat-remark">{trustedCategories.join(' · ')}</div>
              </div>
              <div className="record-stat-cell">
                <div className="record-stat-label">04 &middot; Working days</div>
                <div className="record-stat-value" style={{ fontSize: 20 }}>Mon - Sat</div>
                <div className="record-stat-remark">{companyInfo.timing} &middot; enquiries answered same day</div>
              </div>
            </div>
            <p className="record-footnote">
              Proprietor: {companyInfo.proprietor}. {companyInfo.address}.
            </p>
          </div>
        </section>

        <section className="section wrap">
          <span className="eyebrow">02 &middot; Why plants choose us</span>
          <hr className="section-rule" />
          <div className="grid-hairline grid-3">
            {whyChooseUs.map((item) => (
              <div className="cell" key={item.title}>
                <h2 style={{ fontSize: 19, textTransform: 'uppercase' }}>{item.title}</h2>
                <p className="text-muted" style={{ fontSize: 14, marginTop: 14 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section wrap">
          <span className="eyebrow">03 &middot; Brands we supply</span>
          <hr className="section-rule" />
          <div className="brand-tags">
            {brandsSupplied.map((brand) => (
              <span className="tag" key={brand}>{brand}</span>
            ))}
          </div>
        </section>

        <section className="section wrap">
          <span className="eyebrow">04 &middot; Product range</span>
          <hr className="section-rule" />
          <div className="grid-hairline grid-4">
            {productRange.map((item) => (
              <div className="cell range-card" key={item.title}>
                <div className="card-kicker">{item.kicker}</div>
                <div className="card-title">{item.title}</div>
                <p className="card-body text-muted">{item.body}</p>
                <a href="#catalogue">View products &rarr;</a>
              </div>
            ))}
          </div>
        </section>

        <section className="catalogue section wrap" id="catalogue">
          <span className="eyebrow">05 &middot; Product catalogue</span>
          <hr className="section-rule" />
          <p className="text-muted" style={{ maxWidth: '60ch', marginBottom: 24 }}>
            Prices are shared after enquiry so the team can confirm brand,
            rating, stock and application fit.
          </p>

          <div className="catalogue-tools">
            <label className="field search-field">
              <span>Search products</span>
              <input
                className="input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, SKU, brand or tag"
              />
            </label>

            <div className="category-filter" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === activeCategory ? 'is-active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loadState.loading && <p className="status">Loading catalogue...</p>}
          {loadState.error && <p className="status status--error">{loadState.error}</p>}

          {!loadState.loading && !loadState.error && (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="cell product-card" key={product.id} style={{ padding: 0 }}>
                  <div className="product-card__media">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="product-placeholder" aria-hidden="true">
                        {productInitials(product.name)}
                      </div>
                    )}
                  </div>

                  <div className="product-card__body">
                    <div>
                      <p className="card-kicker">
                        {product.category} {product.brand && `· ${product.brand}`}
                      </p>
                      <h3>
                        {product.sku
                          ? <a href={`/product/${product.sku}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</a>
                          : product.name}
                      </h3>
                      <p className="text-muted">{product.shortDescription}</p>
                    </div>

                    <dl className="product-card__details">
                      <div>
                        <dt>SKU</dt>
                        <dd>{product.sku || 'On request'}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{product.availability || 'Available on enquiry'}</dd>
                      </div>
                      {product.priceRange && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <dt>Price range</dt>
                          <dd style={{ color: 'var(--accent)' }}>{product.priceRange}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="product-card__actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                      >
                        Enquire Price
                      </button>
                      <a
                        className="btn btn-ghost"
                        href={productWhatsappHref(product)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loadState.loading && filteredProducts.length === 0 && (
            <p className="status">No products matched your search.</p>
          )}
        </section>

        <section className="how-section wrap">
          <div>
            <span className="eyebrow">06 &middot; How we work</span>
            <hr className="section-rule" />
            <h2>Sourced, verified, dispatched</h2>
            <p className="text-muted" style={{ maxWidth: '48ch' }}>
              Every enquiry is matched against our stock and supplier network,
              verified for spec and lead time, then confirmed before it's
              booked out - so what arrives is what was quoted.
            </p>
          </div>
          <figure>
            <img src={heroImage} alt="Industrial automation panels and stock" />
          </figure>
        </section>

        <section className="section wrap" id="enquiry" style={{ paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <span className="eyebrow">07 &middot; The parts desk</span>
          <h3 style={{ fontSize: 21, textTransform: 'uppercase', margin: '0 0 12px' }}>
            Have a spec sheet? Send it over.
          </h3>
          <p className="text-muted" style={{ maxWidth: '60ch', marginBottom: 32 }}>
            Add products from the catalogue, or tell us the make, model and
            quantity directly - we'll confirm stock, price and lead time the
            same day.
          </p>

          <div className="enquiry">
            <div className="enquiry__summary">
              <span className="eyebrow">Selected products</span>
              <h2 style={{ fontSize: 22, textTransform: 'uppercase' }}>Send one request for what you need</h2>
              <p className="text-muted" style={{ marginTop: 12, fontSize: 14 }}>
                Vinayak Automation will reply with price, availability and
                options.
              </p>

              <div className="selected-products">
                {selectedProducts.length === 0 ? (
                  <p className="text-muted">No products selected yet.</p>
                ) : (
                  selectedProducts.map((product) => (
                    <span key={product.id}>
                      {product.name}
                      <button
                        type="button"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        x
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <form className="lead-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="field">
                <span>Company</span>
                <input
                  className="input"
                  name="company"
                  value={form.company}
                  onChange={handleFormChange}
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  className="input"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  className="input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </label>

              <label className="field lead-form__message">
                <span>Requirement</span>
                <textarea
                  className="input"
                  name="message"
                  rows="4"
                  value={form.message}
                  onChange={handleFormChange}
                  placeholder="Mention rating, quantity, application or preferred brand."
                />
              </label>

              <button className="btn btn-primary" type="submit">
                Send Enquiry
              </button>

              <a className="btn btn-secondary" href={whatsappLink}>
                Continue on WhatsApp
              </a>

              {submitState && <p className="form-status">{submitState}</p>}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer wrap" id="contact">
        <div>
          <strong>{companyInfo.name}</strong>
          <p>
            &copy; {new Date().getFullYear()} {companyInfo.name} &middot;{' '}
            {companyInfo.address} &middot; GST {companyInfo.gstin}
          </p>
        </div>
        <address>
          <span>{companyInfo.address}</span>
          <a href={directionsLink} target="_blank" rel="noreferrer">
            Get Directions
          </a>
          <a href={`tel:${companyInfo.phone}`}>{companyInfo.phone}</a>
          <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
          <span>{companyInfo.timing}</span>
          <span className="footer__links">
            <a href="#catalogue">Products</a>
            <a href="#enquiry">Contact</a>
          </span>
        </address>
      </footer>

      <a
        className="whatsapp-fab"
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        WhatsApp
      </a>
    </div>
  );
}

export default App;

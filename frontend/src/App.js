import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  businessHighlights,
  companyInfo,
  heroImage,
  leadConfig,
  trustedCategories,
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

function productInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
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
        <div className="topbar__inner">
          <a className="brand" href="#catalogue" aria-label={companyInfo.name}>
            <span className="brand__mark">VA</span>
            <span>
              <strong>{companyInfo.name}</strong>
              <small>Established {companyInfo.establishedYear}</small>
            </span>
          </a>

          <nav className="topbar__nav" aria-label="Primary navigation">
            <a href="#catalogue">Catalogue</a>
            <a href="#enquiry">Enquiry</a>
            <a href="#contact">Contact</a>
          </nav>

          <a className="topbar__phone" href={`tel:${companyInfo.phone}`}>
            {companyInfo.phone}
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__media">
            <img src={heroImage} alt="Industrial automation control equipment" />
          </div>
          <div className="hero__content">
            <p className="eyebrow">{companyInfo.serviceArea}</p>
            <h1>Industrial automation catalogue with quick price enquiry</h1>
            <p>
              Browse drives, panels, PLC and HMI products, sensors, motors and
              electrical services. Select items and send one enquiry for pricing,
              availability and technical fit.
            </p>

            <div className="hero__actions">
              <a className="button button--primary" href="#catalogue">
                View Catalogue
              </a>
              <a className="button button--secondary" href={whatsappLink}>
                Ask on WhatsApp
              </a>
            </div>

            <div className="hero__highlights">
              {businessHighlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="category-strip" aria-label="Popular categories">
          {trustedCategories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </section>

        <section className="trust-strip" aria-label="Why choose us">
          <div>
            <strong>{yearsInBusiness}+</strong>
            <span>Years in business</span>
          </div>
          <div>
            <strong>{trustedCategories.length}+</strong>
            <span>Product categories</span>
          </div>
          <div>
            <strong>Made to order</strong>
            <span>Custom control panels</span>
          </div>
          <div>
            <strong>Pan India</strong>
            <span>{companyInfo.serviceArea}</span>
          </div>
        </section>

        <section className="catalogue" id="catalogue">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Product catalogue</p>
              <h2>Find the right automation product</h2>
            </div>
            <p>
              Prices are shared after enquiry so the team can confirm brand,
              rating, stock and application fit.
            </p>
          </div>

          <div className="catalogue-tools">
            <label className="search-field">
              <span>Search products</span>
              <input
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
                <article className="product-card" key={product.id}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="product-placeholder" aria-hidden="true">
                      {productInitials(product.name)}
                    </div>
                  )}

                  <div className="product-card__body">
                    <div>
                      <p className="product-card__meta">
                        {product.category} {product.brand && `- ${product.brand}`}
                      </p>
                      <h3>{product.name}</h3>
                      <p>{product.shortDescription}</p>
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
                    </dl>

                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                    >
                      Enquire Price
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loadState.loading && filteredProducts.length === 0 && (
            <p className="status">No products matched your search.</p>
          )}
        </section>

        <section className="enquiry" id="enquiry">
          <div className="enquiry__summary">
            <p className="eyebrow">Lead enquiry</p>
            <h2>Send one request for selected products</h2>
            <p>
              Add products from the catalogue, share your contact details, and
              Vinayak Automation can reply with price, availability and options.
            </p>

            <div className="selected-products">
              {selectedProducts.length === 0 ? (
                <p>No products selected yet.</p>
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
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Company
              <input
                name="company"
                value={form.company}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
              />
            </label>

            <label className="lead-form__message">
              Requirement
              <textarea
                name="message"
                rows="4"
                value={form.message}
                onChange={handleFormChange}
                placeholder="Mention rating, quantity, application or preferred brand."
              />
            </label>

            <button className="button button--primary" type="submit">
              Send Enquiry
            </button>

            <a className="button button--secondary" href={whatsappLink}>
              Continue on WhatsApp
            </a>

            {submitState && <p className="form-status">{submitState}</p>}
          </form>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div>
          <strong>{companyInfo.name}</strong>
          <p>{companyInfo.tagline}</p>
          <p className="footer__meta">
            Proprietor: {companyInfo.proprietor} · GSTIN: {companyInfo.gstin}
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

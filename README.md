# Vinayak Automation - Website

A single static website that showcases the product catalogue and captures pricing enquiries as leads. No backend, no database - it deploys as plain static files.

- **Catalogue**: read live from a Google Sheet (published as CSV), so it can be updated in Excel/Sheets without touching code or redeploying. See [CATALOG_UPDATE_GUIDE.md](./CATALOG_UPDATE_GUIDE.md).
- **Enquiries**: visitors pick products and submit a form. It emails you automatically via [Web3Forms](https://web3forms.com) (free), with a WhatsApp/mailto fallback.

## Run it locally

```bash
npm install
npm start
```

Visit http://localhost:3000.

## Deploy (Cloudflare Pages, free)

1. Push this repository to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com/), go to **Workers & Pages -> Create -> Pages -> Connect to Git** and select the repo.
3. Build settings:
   - Framework preset: `Create React App`
   - Build command: `npm run build`
   - Build output directory: `build`
4. Deploy. Cloudflare gives you a free `*.pages.dev` URL immediately.
5. Optional - add your own domain (e.g. `vinayakautomation.in`) under **Custom domains** on the Pages project. A `.in` domain costs roughly ₹500-800/year from any registrar; Cloudflare Pages hosting itself stays free.

Every future `git push` automatically redeploys the site. Since the catalogue lives in a Google Sheet (not in this repo), day-to-day product updates need no redeploy at all.

## One-time setup before going live

Two things need a value filled in before the site is fully "live" (the site works without them, just with reduced functionality) - both are in [`src/data.js`](./src/data.js):

1. `companyInfo.catalogueUrl` - point at your published Google Sheet CSV link.
2. `leadConfig.web3formsAccessKey` - your free Web3Forms access key, so enquiries email you directly.

Full step-by-step instructions for both are in [CATALOG_UPDATE_GUIDE.md](./CATALOG_UPDATE_GUIDE.md).

## Project structure

- `src/data.js` - business info, contact details, and the two settings above
- `src/App.js` - page logic (catalogue fetch/search, enquiry form)
- `public/catalog.csv` - starter/example catalogue, used until the Google Sheet is configured

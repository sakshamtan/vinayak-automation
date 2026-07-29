# Catalogue & Lead Email Setup Guide

This covers the two things a non-technical person needs to manage day to day: updating the product catalogue, and making sure enquiries land in your inbox.

## 1. Updating the product catalogue (no redeploy needed)

The website reads its product list live from a Google Sheet, so updating products is just editing a spreadsheet - no code, no developer needed after the one-time setup below.

### One-time setup

1. Create a new Google Sheet.
2. Set up these column headers in row 1 (matching `public/catalog.csv`, which you can open in Excel to see an example):

   | sku | name | category | brand | shortDescription | image | availability | tags |
   |---|---|---|---|---|---|---|---|

   - **sku**: unique product code, e.g. `VAP-DRV-001`.
   - **name**: product name shown on the site.
   - **category**: used for the category filter buttons.
   - **brand**: brand/supplier, or `Multi Brand`.
   - **shortDescription**: one or two lines about the product.
   - **image**: a direct image URL, or leave blank for an automatic placeholder (see Images below).
   - **availability**: e.g. `Available on enquiry`, `Made to order`, `Service enquiry`.
   - **tags**: optional search keywords, space separated.

   If you already have an Excel catalogue: in Google Sheets, go to **File -> Import -> Upload**, choose your Excel file, and pick "Replace current sheet" or "Insert new sheet".

3. Publish the sheet as CSV: **File -> Share -> Publish to web**. Under "Link", choose the correct sheet/tab and select **Comma-separated values (.csv)**, then click **Publish**.
4. Copy the generated link (it looks like `https://docs.google.com/spreadsheets/d/e/xxxxx/pub?output=csv`).
5. Open `src/data.js` and paste it as `catalogueUrl`:

   ```js
   catalogueUrl: "https://docs.google.com/spreadsheets/d/e/xxxxx/pub?output=csv",
   ```

6. Commit/deploy this one change. From then on, this step is never needed again.

### Ongoing updates

Just edit the Google Sheet - add rows, change prices/availability text, reorder. The live site picks up changes automatically within a few minutes (Google's CSV cache refreshes periodically). No developer, no redeploy.

### Images

- Easiest: upload your product photo to a free image host such as [imgbb.com](https://imgbb.com) (no account required) and paste the **direct image link** into the `image` column.
- Avoid Google Drive links for images - Drive's sharing links don't reliably display as `<img>` sources.
- Leave `image` blank if you don't have a photo yet; the site shows a clean placeholder with the product's initials instead of a broken image.

## 2. Getting enquiry emails automatically

When a visitor selects products and submits the enquiry form, the site can email you directly via [Web3Forms](https://web3forms.com) - free, no submission limit, no card required.

### One-time setup

1. Go to [web3forms.com](https://web3forms.com) and enter the email address where you want to receive enquiries.
2. You'll get an **Access Key** by email - copy it.
3. Open `src/data.js` and paste it in:

   ```js
   web3formsAccessKey: "your-access-key-here",
   ```

4. Commit/deploy this change.

That's it - every submitted enquiry now arrives in your inbox with the visitor's name, phone, email, message, and the exact products they picked.

### If you skip this step

The site still works: the enquiry form falls back to opening the visitor's own email app (pre-filled) or a WhatsApp chat link, so you don't lose enquiries entirely - but fewer visitors will complete an email app popup than a plain "Submit" button, so setting up Web3Forms is worth the five minutes.

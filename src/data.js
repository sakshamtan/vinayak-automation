export const companyInfo = {
  name: "Vinayak Automation",
  tagline: "Industrial automation products, control panels, drives and electrical solutions.",
  phone: "+91-9818092533",
  whatsapp: "919818092533",
  email: "vinayakautomation10@gmail.com",
  timing: "Mon - Sat, 10:00 AM - 6:00 PM",
  address: "Plot No. 461, Indira Vihar, Dr Mukerjee Nagar, Near BBM Depot, Delhi - 110009",
  mapsUrl: "https://maps.app.goo.gl/TfHSWKaDjoAxuLsh6",
  establishedYear: 2010,
  serviceArea: "Delhi NCR and industrial customers across India",
  gstin: "07ACRPT1554D1ZE",
  proprietor: "Jogender Taneja",
  // Point this at a Google Sheet published as CSV (File > Share > Publish to web > CSV)
  // so the catalogue can be updated without a redeploy. See CATALOG_UPDATE_GUIDE.md.
  // Left as the local starter file until that's set up.
  catalogueUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRLMCmS1rfKEcndCtsOLrrRP-Ztf3MFsFRhpiWta3VUqCQzm6asw-gRnL2gXHCe17eqSfJe9-WiQ6T/pub?gid=748339378&single=true&output=csv",
};

export const leadConfig = {
  // Free access key from https://web3forms.com - enquiries email straight to you.
  // Leave blank to fall back to mailto/WhatsApp only. See CATALOG_UPDATE_GUIDE.md.
  web3formsAccessKey: "ac15904b-310c-491f-96ae-fc1ecb9f86bc",
};

export const heroImage =
  "https://images.pexels.com/photos/2760243/pexels-photo-2760243.jpeg";

export const trustedCategories = [
  "AC Drives",
  "PLC & HMI",
  "Control Panels",
  "Motors",
  "Transformers",
  "Sensors",
  "Electrical Repair",
];

export const brandsSupplied = [
  "Siemens",
  "ABB",
  "Schneider Electric",
  "Delta",
  "Mitsubishi Electric",
  "L&T",
  "Allen-Bradley",
];

export const whyChooseUs = [
  {
    title: "Genuine, tested stock",
    body: "Every part is checked against OEM specification before it leaves the shelf - no grey-market substitutes, no surprises on site.",
  },
  {
    title: "Cross-brand sourcing",
    body: "Siemens, ABB, Schneider, Delta, Mitsubishi and more - matched to the panel you already have, not the one we'd rather sell.",
  },
  {
    title: "Fast turnaround",
    body: "Enquiry to dispatch in days, not weeks. Critical spares are kept on shelf for breakdown support, not ordered on demand.",
  },
];

export const productRange = [
  {
    kicker: "Controllers",
    title: "PLC & Controllers",
    body: "PLCs, HMI panels, I/O modules.",
  },
  {
    kicker: "Motor control",
    title: "Variable Frequency Drives",
    body: "AC drives, soft starters, spares.",
  },
  {
    kicker: "Panel gear",
    title: "Switchgear",
    body: "MCCBs, contactors, relays, breakers.",
  },
  {
    kicker: "Breakdown support",
    title: "Critical Spares",
    body: "Sensors, power supplies, terminals.",
  },
];

# NEXAR Website

A responsive, multilingual static business website for NEXAR — LED Display Solutions. It presents indoor and outdoor LED display products, services, project placeholders, company information, and a WhatsApp quote workflow.

The site uses only HTML, CSS, and vanilla JavaScript. It works by opening `index.html` directly and is ready for GitHub Pages.

## File structure

```text
.
├── index.html
├── products.html
├── projects.html
├── about.html
├── contact.html
├── 404.html
├── README.md
└── assets
    ├── css/style.css
    ├── js/main.js
    └── images
        ├── nexar-logo-dark.png
        ├── nexar-logo-light.png
        ├── nexar-business-card.png
        ├── products/
        └── projects/
```

## Preview locally

Open `index.html` in a modern browser. No build step or local server is required. You can also use a simple static-server extension in your editor if preferred.

## Images

- Brand images live in `assets/images/`.
- Add product photos to the matching folder in `assets/images/products/`, then run
  `npm run generate-products` to refresh the static product manifest.
- P1.5, P2, P2.5, P3, and P4 use separate `indoor/` and `outdoor/` folders.
- P5, P6, and the additional display categories use images directly inside their
  category folder. Supported formats are PNG, JPG, JPEG, WEBP, and AVIF.
- GitHub Pages and browsers cannot list static directory contents, so
  `assets/images/products/products-manifest.json` is generated and committed.
- Add real project photos to `assets/images/projects/`.
- Project cards currently use clearly labelled CSS placeholders. Replace those placeholders only after real project images and verified details are available.
- If a logo cannot load, the navigation uses a text fallback.

## Edit company details

Search the HTML files for `07501333634`, `info@nexar.com`, and `Ranya` to update contact details. Replace social links that currently use `href="#"`. Replace the business-hours and map placeholders in `contact.html`.

All interface translations are stored in the `translations` object in `assets/js/main.js`. Kurdish Sorani is the default; English and Arabic are also included.

## Change the WhatsApp number

Edit this clearly named constant near the top of `assets/js/main.js`:

```js
const NEXAR_WHATSAPP_NUMBER = '9647501333634';
```

Use the international number without `+`, spaces, or a leading zero. Also update the direct WhatsApp links in the HTML files if the number changes.

## Deploy to GitHub Pages

1. Create a GitHub repository and upload these files to the repository root.
2. Commit and push to the `main` branch.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select **main** and **root**.
6. Save and wait for GitHub Pages to publish the site.

All links and assets use relative paths, so the website works inside a GitHub Pages repository subdirectory.

## Pre-deployment checklist

- [ ] Confirm phone, email, location, and business hours.
- [ ] Replace social-media placeholder links.
- [ ] Add the final map link.
- [ ] Replace project placeholders with real, approved project images and details.
- [ ] Confirm technical specifications for the selected model.
- [ ] Review Kurdish, English, and Arabic copy.
- [ ] Test the mobile menu and keyboard focus.
- [ ] Test product and project filters.
- [ ] Submit both quote forms and confirm the WhatsApp message.
- [ ] Check every page at mobile, tablet, and desktop widths.
- [ ] Confirm favicon and Open Graph image.

# GioEquinox

A responsive perfume and watch catalogue storefront for GioEquinox.

## Run locally

Open `index.html` to enter the perfume collection, or browse `equinox.html`, `watches.html`, and `equinox-family.html` directly. The pages are self-contained and do not require a build step.

## Live site

The site is published with GitHub Pages from the `main` branch root.

## Current features

- Responsive landing page and perfume catalogue
- Scent-family filters
- Per-product like/dislike controls saved in the current browser
- One persistent cart shared by the perfume and watch catalogues, with quantity controls and combined WhatsApp enquiries
- Separate watch collection page with its own design, filters, and reactions
- Product photos and ZMW price references linked to the retailer listings used for comparison
- No-billing, browser-only product recommendation demos on the perfume and watch pages
- Equinox Family registration page with consent, phone validation, and WhatsApp handoff
- Store address, phone, and email links

The shared cart is saved in the visitor's browser and is not an online database. Existing perfume and watch cart selections are migrated into it when the catalogues are next opened in that browser.

## Catalogue recommendation demo

The perfume and watch catalogues have a small product-matching demo that ranks the published catalogue using typed keywords and an optional K budget. A visitor can open a match or add it to the shared cart. It runs locally in the browser, makes no API requests, uses no provider key, and does not send visitors' messages or other data anywhere. It is a rule-based demo, not a generative AI model.

## Product photos and price references

The catalogue displays retailer comparison prices, not confirmed GioEquinox selling prices. The listed USD amounts were checked on 17 November 2026 and converted at US$1 = K20.580374, rounded to the nearest kwacha. They exclude shipping, tax, and import duties; local prices, product authenticity, exact variants, and availability must be confirmed with GioEquinox. The Casio Walmart listing was out of stock when checked.

| Catalogue item | Retailer reference | Price shown |
| --- | --- | ---: |
| Chanel No. 5, 100 ml | [Walmart search](https://www.walmart.com/search?q=Chanel+No.+5+3.4+oz+perfume) · US$179 | K3,684 |
| Chanel Coco Mademoiselle, 50 ml | [Walmart search](https://www.walmart.com/search?q=Chanel+Coco+Mademoiselle+1.7+oz) · US$119 | K2,449 |
| Chanel Coco Noir, 100 ml | [Walmart search](https://www.walmart.com/search?q=Chanel+Coco+Noir+3.4+oz) · US$164.89 | K3,393 |
| Versace Eros, 100 ml | [Walmart search](https://www.walmart.com/search?q=Versace+Eros+EDT+3.4+oz) · US$54.99 | K1,132 |
| Marc Jacobs Daisy, 100 ml | [Walmart search](https://www.walmart.com/search?q=Marc+Jacobs+Daisy+3.4+oz) · US$53.68 | K1,105 |
| Calvin Klein CK One, 200 ml | [Walmart search](https://www.walmart.com/search?q=Calvin+Klein+CK+One+6.7+oz) · US$29.67 | K611 |
| Poedagar 978 | [Walmart search](https://www.walmart.com/search?q=Poedagar+978+watch) · US$21.99 | K453 |
| SKMEI 2471 | [SKMEI Store listing](https://www.shopskmei.com/product/skmei-2471-5-bar-analog-digital-sport-watch/) · US$54.63 | K1,124 |
| Rolex Datejust 36 | [Mayors listing](https://www.mayors.com/Rolex/Datejust-36-M126200+0002/p/17303970) · US$8,150 | K167,730 |
| Casio G-Shock DW5600E-1V | [Walmart search](https://www.walmart.com/search?q=Casio+G-Shock+DW5600E-1V) · US$64.92, out of stock | K1,336 |

### Image credits

The Unsplash photos are used under the [Unsplash License](https://unsplash.com/license):

| Local file | Source |
| --- | --- |
| `perfume-chanel-no5.jpg` | [Unsplash image](https://images.unsplash.com/photo-1541643600914-78b084683601) |
| `perfume-coco-mademoiselle.jpg` | [Unsplash image](https://images.unsplash.com/photo-1592945403244-b3fbafd7f539) |
| `perfume-coco-noir.jpg` | [Unsplash image](https://images.unsplash.com/photo-1594035910387-fea47794261f) |
| `perfume-versace-eros.jpg` | [Unsplash image](https://images.unsplash.com/photo-1587017539504-67cfbddac569) |
| `perfume-marc-jacobs-daisy.jpg` | [Unsplash image](https://images.unsplash.com/photo-1763986665850-6e66549aa8e0) |
| `perfume-calvin-klein-ck-one.jpg` | [Unsplash image](https://images.unsplash.com/photo-1619007556336-4d99b008471e) |
| `watch-poedagar-style.jpg` | [Representative Unsplash image](https://images.unsplash.com/photo-1524805444758-089113d48a6d) — illustrative style only; not the exact Poedagar model |

Other watch photos:

- `watch-skmei-1167.jpg`: [Raimundo Augusto Júnior, “Skmei 1167”](https://commons.wikimedia.org/wiki/File:Skmei_1167.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The locally resized image is also available under CC BY-SA 4.0. The catalogue's SKMEI price reference is for model 2471; the photo is model 1167.
- `watch-rolex-datejust.jpg`: [Mike Searson, “Rolex Datejust”](https://commons.wikimedia.org/wiki/File:Rolex_Datejust.JPG), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The photographed vintage bezel differs from the retailer's current 36 mm reference.
- `watch-casio-gshock-dw5600e.jpg`: [Simon Le Bon / Pittigrilli, “Casio G-Shock DW-5600E wristwatch”](https://commons.wikimedia.org/wiki/File:Casio_G-Shock_DW-5600E_wristwatch.jpg), released to the public domain.

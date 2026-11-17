(() => {
    const grid = document.getElementById('product-grid');
    const api = window.GioCatalogueApi;
    if (!grid || !api?.isConfigured) return;

    const status = document.getElementById('catalogue-load-status');
    const setStatus = message => {
        if (status) status.textContent = message;
    };

    const make = (tagName, className, text) => {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    };

    const makeReactionButton = (name, reaction, label) => {
        const button = make('button', 'reaction-button', reaction === 'like' ? '♡' : '×');
        button.type = 'button';
        button.dataset.reaction = reaction;
        button.setAttribute('aria-label', `${label} ${name}`);
        button.setAttribute('aria-pressed', 'false');
        return button;
    };

    const makeProductCard = product => {
        const type = product.product_type;
        if (!['fragrance', 'watch'].includes(type)) return null;
        const pageType = grid.classList.contains('watch-grid') ? 'watch' : 'fragrance';
        if ((pageType === 'watch') !== (type === 'watch')) return null;

        const classes = pageType === 'watch' ? 'watch-card' : 'product-card';
        const card = make('article', classes);
        const tags = Array.isArray(product.tags) ? product.tags : [];
        const category = [...new Set([type, ...tags])].join(' ');
        const price = Number(product.price);
        card.id = `catalogue-product-${product.id}`;
        card.dataset.product = product.name;
        card.dataset.category = category;
        card.dataset.catalogueProductId = product.id;
        card.dataset.price = String(price);
        card.dataset.priceType = 'catalogue';

        const art = make('div', pageType === 'watch' ? 'watch-art' : 'product-art');
        const image = make('img', pageType === 'watch' ? 'watch-photo' : 'product-photo');
        image.src = api.publicImageUrl(product.image_path);
        image.alt = product.name;
        image.loading = 'lazy';
        image.decoding = 'async';
        art.append(image);

        const info = make('div', pageType === 'watch' ? 'watch-info' : 'product-info');
        const meta = make('div', pageType === 'watch' ? 'watch-meta' : 'product-meta');
        meta.append(
            make('span', '', tags.length ? tags.join(' · ') : type),
            make('span', '', 'NEW')
        );
        const title = make('h3', '', product.name);
        const description = make('p', pageType === 'watch' ? 'watch-description' : 'product-notes', product.description);
        const priceLine = make('p', pageType === 'watch' ? 'watch-price' : 'product-price', `K${price.toLocaleString('en-ZM', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} `);
        priceLine.append(make('span', '', 'GioEquinox price'));

        const bottom = make('div', pageType === 'watch' ? 'watch-bottom' : 'product-bottom');
        const actions = make('div', pageType === 'watch' ? 'watch-actions' : 'product-order-actions');
        const addButton = make('button', 'add-to-cart', 'Add to cart');
        addButton.type = 'button';
        addButton.dataset.addToCart = '';
        const enquiry = make('a', pageType === 'watch' ? 'whatsapp-link' : 'enquire-link', pageType === 'watch' ? 'Ask on WhatsApp ↗' : 'Enquire on WhatsApp ↗');
        const enquiryText = encodeURIComponent(`Hello GioEquinox, I would like to enquire about ${product.name}.`);
        enquiry.href = `https://wa.me/260777907071?text=${enquiryText}`;
        enquiry.target = '_blank';
        enquiry.rel = 'noopener noreferrer';
        actions.append(addButton, enquiry);

        const reactions = make('div', 'reaction-controls');
        reactions.setAttribute('role', 'group');
        reactions.setAttribute('aria-label', `Rate ${product.name}`);
        reactions.append(makeReactionButton(product.name, 'like', 'Like'), makeReactionButton(product.name, 'dislike', 'Dislike'));
        bottom.append(actions, reactions);
        info.append(meta, title, description, priceLine, bottom);
        card.append(art, info);
        return card;
    };

    const loadProducts = async () => {
        setStatus('');
        const products = await api.listProducts();
        const existingNames = new Set(
            [...grid.querySelectorAll('[data-product]')].map(card => card.dataset.product.toLowerCase())
        );
        let added = 0;
        products.forEach(product => {
            if (!product.active || existingNames.has(String(product.name).toLowerCase())) return;
            const card = makeProductCard(product);
            if (card) {
                grid.insertBefore(card, grid.querySelector('.empty-state'));
                added++;
            }
        });
        window.dispatchEvent(new CustomEvent('gioequinox:catalogue-updated'));
        if (added && document.querySelectorAll('.filter-button[aria-pressed="true"][data-filter="all"]').length === 0) {
            document.querySelector('.filter-button[data-filter="all"]')?.click();
        }
    };

    loadProducts().catch(error => {
        console.error('Additional catalogue products could not be loaded.', error);
        setStatus('New products could not be loaded right now. The existing catalogue is still available.');
    });
})();

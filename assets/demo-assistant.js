(() => {
    const form = document.getElementById('demo-assistant-form');
    const input = document.getElementById('demo-assistant-input');
    const results = document.getElementById('demo-assistant-results');
    const grid = document.getElementById('product-grid');
    if (!form || !input || !results || !grid) return;

    const products = [...grid.querySelectorAll('[data-product]')].map(card => {
        const description = card.querySelector('.product-notes, .watch-description')?.textContent.trim() || '';
        const price = Number(card.dataset.price);
        const searchText = `${card.dataset.product} ${card.dataset.category} ${description}`.toLowerCase();
        return {
            card,
            name: card.dataset.product,
            description,
            categories: card.dataset.category.split(/\s+/),
            price: Number.isSafeInteger(price) && price >= 0 ? price : null,
            searchText
        };
    });

    const escapeHtml = value => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const findBudget = query => {
        const match = query.match(/(?:\b(?:under|below|max(?:imum)?(?:\s+budget)?)\s*(?:kwacha\s*|k\s*)?|\b(?:kwacha|k)\s*)([\d,]+)/i);
        if (!match) return null;
        const amount = Number(match[1].replaceAll(',', ''));
        return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
    };

    const recommend = query => {
        const normalized = query.toLowerCase();
        const terms = normalized.match(/[a-z0-9]+/g) || [];
        const ignoredTerms = new Set([
            'i', 'me', 'my', 'a', 'an', 'the', 'for', 'with', 'and', 'or', 'please',
            'under', 'below', 'maximum', 'max', 'budget', 'k', 'kwacha',
            'recommend', 'recommendation', 'recommendations', 'suggestion', 'suggestions',
            'suggest', 'something', 'anything', 'want', 'need', 'looking', 'find',
            'show', 'give', 'nice', 'good', 'best', 'perfume', 'perfumes', 'fragrance',
            'fragrances', 'scent', 'scents', 'watch', 'watches'
        ]);
        const searchTerms = terms.filter(term => !ignoredTerms.has(term) && !/^(?:k|kwacha)?\d[\d,]*$/.test(term));
        const mentionedBrands = ['poedagar', 'skmei', 'rolex', 'casio', 'chanel', 'versace', 'marc', 'jacobs', 'calvin', 'klein']
            .filter(brand => terms.includes(brand));
        const budget = findBudget(normalized);
        const ranked = products
            .filter(product =>
                (budget === null || product.price === null || product.price <= budget) &&
                (!mentionedBrands.length || mentionedBrands.every(brand => product.searchText.includes(brand)))
            )
            .map(product => {
                let score = 0;
                for (const term of searchTerms) {
                    if (product.searchText.includes(term)) score += product.name.toLowerCase().includes(term) ? 4 : 2;
                    if (term === 'light' && product.categories.includes('fresh')) score += 1;
                    if (term === 'dressy' && product.categories.includes('classic')) score += 1;
                    if (term === 'sporty' && product.categories.includes('sport')) score += 1;
                }
                if (score === 0 && searchTerms.length === 0) score = 1;
                return { ...product, score };
            })
            .filter(product => product.score > 0)
            .sort((left, right) => right.score - left.score || (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER))
            .slice(0, 3);

        return { budget, products: ranked };
    };

    const renderRecommendations = query => {
        const { budget, products: matches } = recommend(query);
        if (!matches.length) {
            results.innerHTML = `<p class="demo-assistant-empty">${budget === null
                ? 'I could not find a close catalogue match. Try a brand, scent family, note, or style such as “floral”, “citrus”, “sporty”, or “Rolex”.'
                : `No listed products matched that budget. Try a higher budget or remove the budget from your search.`}</p>`;
            return;
        }

        const intro = budget === null ? 'A few catalogue matches to explore:' : `Matches within your K${budget.toLocaleString('en-US')} budget:`;
        results.innerHTML = `<p class="demo-assistant-copy">${intro}</p>${matches.map(product => `
            <article class="demo-assistant-result">
                <div>
                    <h4>${escapeHtml(product.name)}</h4>
                    <p>${escapeHtml(product.description)}</p>
                    <p>${product.price === null ? 'Price to confirm' : `Retailer reference: K${product.price.toLocaleString('en-US')} · confirm local price`}</p>
                </div>
                <div class="demo-assistant-result-actions">
                    <a href="#${escapeHtml(product.card.id || 'collection')}" data-assistant-view="${escapeHtml(product.name)}">View item</a>
                    <button class="demo-assistant-add" type="button" data-assistant-add="${escapeHtml(product.name)}">Add to cart</button>
                </div>
            </article>`).join('')}`;
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        const query = input.value.trim();
        if (query) renderRecommendations(query);
    });

    document.querySelectorAll('[data-assistant-prompt]').forEach(button => {
        button.addEventListener('click', () => {
            input.value = button.dataset.assistantPrompt;
            renderRecommendations(input.value);
        });
    });

    results.addEventListener('click', event => {
        const viewLink = event.target.closest('[data-assistant-view]');
        if (viewLink) {
            event.preventDefault();
            const product = products.find(item => item.name === viewLink.dataset.assistantView);
            if (product) {
                document.querySelectorAll('.filter-button').forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset.filter === 'all'));
                });
                products.forEach(item => { item.card.hidden = false; });
                product.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const addButton = event.target.closest('[data-assistant-add]');
        if (!addButton) return;
        const product = products.find(item => item.name === addButton.dataset.assistantAdd);
        const cartButton = product?.card.querySelector('[data-add-to-cart]');
        if (cartButton) cartButton.click();
    });
})();

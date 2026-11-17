(() => {
    const api = window.GioCatalogueApi;
    if (!api) return;

    const signInPanel = document.getElementById('sign-in-panel');
    const signInForm = document.getElementById('sign-in-form');
    const dashboard = document.getElementById('dashboard');
    const productForm = document.getElementById('product-form');
    const signInStatus = document.getElementById('sign-in-status');
    const productStatus = document.getElementById('product-status');
    const listStatus = document.getElementById('list-status');
    const productList = document.getElementById('product-list');
    const saveButton = document.getElementById('save-product');
    const imageInput = productForm.elements.image;
    const imagePreview = document.getElementById('image-preview');
    let previewUrl = '';

    const setStatus = (element, message, state = '') => {
        element.textContent = message;
        if (state) element.dataset.state = state;
        else delete element.dataset.state;
    };

    const showDashboard = isVisible => {
        signInPanel.hidden = isVisible;
        dashboard.hidden = !isVisible;
    };

    const formatPrice = value => `K${Number(value).toLocaleString('en-ZM', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const renderProducts = products => {
        productList.replaceChildren();
        if (!products.length) {
            setStatus(listStatus, 'No products have been added yet.');
            return;
        }
        setStatus(listStatus, '');
        products.forEach(product => {
            const item = document.createElement('li');
            item.className = 'product-row';
            const image = document.createElement('img');
            image.src = api.publicImageUrl(product.image_path);
            image.alt = '';
            image.loading = 'lazy';
            const details = document.createElement('div');
            const name = document.createElement('h3');
            name.textContent = product.name;
            const meta = document.createElement('p');
            meta.textContent = `${product.product_type === 'watch' ? 'Timepiece' : 'Fragrance'} · ${product.active ? 'Published' : 'Taken off catalogue'}`;
            details.append(name, meta);
            const price = document.createElement('span');
            price.className = 'product-price';
            price.textContent = formatPrice(product.price);
            const availabilityButton = document.createElement('button');
            availabilityButton.type = 'button';
            availabilityButton.className = 'product-status-button';
            availabilityButton.dataset.productId = product.id;
            availabilityButton.dataset.active = String(product.active);
            availabilityButton.textContent = product.active ? 'Take down' : 'Republish';
            availabilityButton.setAttribute(
                'aria-label',
                `${product.active ? 'Take down' : 'Republish'} ${product.name}`
            );
            item.append(image, details, price, availabilityButton);
            productList.append(item);
        });
    };

    const loadProducts = async () => {
        setStatus(listStatus, 'Loading products…');
        const products = await api.listProducts({ admin: true });
        if (!Array.isArray(products)) throw new Error('Supabase returned an invalid product list.');
        renderProducts(products);
    };

    productList.addEventListener('click', async event => {
        const button = event.target.closest('button[data-product-id]');
        if (!button) return;

        const productId = button.dataset.productId;
        const shouldActivate = button.dataset.active !== 'true';
        button.disabled = true;
        setStatus(listStatus, shouldActivate ? 'Republishing product…' : 'Taking product off the catalogue…');
        try {
            await api.setProductActive(productId, shouldActivate);
            setStatus(
                listStatus,
                shouldActivate
                    ? 'Product republished. Refreshing the list…'
                    : 'Product taken off the public catalogue. Refreshing the list…',
                'success'
            );
            try {
                await loadProducts();
            } catch (error) {
                console.error('Product availability changed, but the admin list could not be refreshed.', error);
                setStatus(
                    listStatus,
                    `Product availability changed, but the list could not be refreshed: ${error.message}`,
                    'error'
                );
                button.disabled = false;
                return;
            }
            setStatus(
                listStatus,
                shouldActivate
                    ? 'Product republished on the public catalogue.'
                    : 'Product taken off the public catalogue. You can republish it here later.',
                'success'
            );
        } catch (error) {
            console.error('Product availability could not be changed.', error);
            setStatus(listStatus, error.message || 'Product availability could not be changed.', 'error');
            button.disabled = false;
        }
    });

    const verifySession = async session => {
        const currentSession = await api.authorizedSession();
        if (session && currentSession.user.id !== session.user.id) {
            throw new Error('The saved owner session changed. Please sign in again.');
        }
        if (!await api.adminSession(currentSession)) {
            await api.signOut();
            throw new Error('This account is not authorized to manage the GioEquinox catalogue.');
        }
        showDashboard(true);
        try {
            await loadProducts();
        } catch (error) {
            console.error('Catalogue products could not be loaded in the owner dashboard.', error);
            setStatus(listStatus, `Products could not be loaded: ${error.message}`, 'error');
        }
    };

    const configProblem = api.configError();
    if (configProblem) setStatus(signInStatus, configProblem.message, 'error');

    if (api.isConfigured) {
        const savedSession = api.getSession();
        if (savedSession) {
            verifySession(savedSession).catch(error => {
                console.error('Saved catalogue admin session could not be verified.', error);
                setStatus(signInStatus, error.message, 'error');
                showDashboard(false);
            });
        }
    }

    signInForm.addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = signInForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        setStatus(signInStatus, 'Signing in…');
        try {
            const session = await api.signIn(signInForm.elements.email.value.trim(), signInForm.elements.password.value);
            await verifySession(session);
            signInForm.reset();
        } catch (error) {
            console.error('Catalogue admin sign-in failed.', error);
            setStatus(signInStatus, error.message || 'Sign-in failed. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    imageInput.addEventListener('change', () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = '';
        imagePreview.replaceChildren();
        const image = imageInput.files[0];
        if (!image) {
            imagePreview.hidden = true;
            return;
        }
        previewUrl = URL.createObjectURL(image);
        const previewImage = document.createElement('img');
        previewImage.src = previewUrl;
        previewImage.alt = 'Selected product photo preview';
        const filename = document.createElement('span');
        filename.textContent = `${image.name} · ${(image.size / 1024 / 1024).toFixed(2)} MB`;
        imagePreview.append(previewImage, filename);
        imagePreview.hidden = false;
    });

    productForm.addEventListener('submit', async event => {
        event.preventDefault();
        saveButton.disabled = true;
        setStatus(productStatus, 'Uploading photo and saving product…');
        try {
            const form = new FormData(productForm);
            const tagsValue = String(form.get('tags') || '').trim();
            const tags = tagsValue
                ? [...new Set(tagsValue.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))]
                : [];
            await api.createProduct({
                name: String(form.get('name') || ''),
                description: String(form.get('description') || ''),
                price: Number(form.get('price')),
                productType: String(form.get('productType') || ''),
                tags,
                image: imageInput.files[0]
            });
            productForm.reset();
            imagePreview.replaceChildren();
            imagePreview.hidden = true;
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = '';
            setStatus(productStatus, 'Product published successfully.', 'success');
            try {
                await loadProducts();
            } catch (error) {
                console.error('The product was published but the owner list could not be refreshed.', error);
                setStatus(listStatus, `Product was published, but the list could not be refreshed: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Catalogue product could not be published.', error);
            setStatus(productStatus, error.message || 'The product could not be saved.', 'error');
        } finally {
            saveButton.disabled = false;
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        const button = document.getElementById('sign-out');
        button.disabled = true;
        let signOutError = '';
        try {
            await api.signOut();
        } catch (error) {
            console.error('Supabase sign-out request failed.', error);
            signOutError = ` Signed out in this browser, but Supabase sign-out failed: ${error.message}`;
        } finally {
            showDashboard(false);
            setStatus(signInStatus, `You have signed out.${signOutError}`, signOutError ? 'error' : '');
            button.disabled = false;
        }
    });
})();

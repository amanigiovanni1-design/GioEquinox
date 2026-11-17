(() => {
    const config = window.GIOEQUINOX_SUPABASE || {};
    const supabaseUrl = String(config.url || '').trim().replace(/\/+$/, '');
    const anonKey = String(config.anonKey || '').trim();
    const sessionKey = 'gioequinox-catalogue-admin-session';
    const allowedImageTypes = new Map([
        ['image/jpeg', 'jpg'],
        ['image/png', 'png'],
        ['image/webp', 'webp']
    ]);

    const isConfigured = Boolean(supabaseUrl && anonKey);

    const configError = () => {
        if (!isConfigured) {
            return new Error('Add your Supabase project URL and publishable/anon key to assets/catalogue-config.js, then commit and push that file.');
        }
        try {
            const parsedUrl = new URL(supabaseUrl);
            if (!['https:', 'http:'].includes(parsedUrl.protocol)) throw new Error();
        } catch {
            return new Error('The Supabase project URL in assets/catalogue-config.js is not a valid HTTP(S) URL.');
        }
        return null;
    };

    const readError = async response => {
        const body = await response.json().catch(() => null);
        const message = body?.msg || body?.message || body?.error_description || body?.error;
        return new Error(typeof message === 'string' ? message : `Supabase request failed (${response.status}).`);
    };

    const request = async (path, { method = 'GET', token, body, headers = {} } = {}) => {
        const issue = configError();
        if (issue) throw issue;
        const response = await fetch(`${supabaseUrl}${path}`, {
            method,
            headers: {
                apikey: anonKey,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers
            },
            ...(body === undefined ? {} : { body })
        });
        if (!response.ok) throw await readError(response);
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    };

    const getSession = () => {
        try {
            const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
            if (!saved || typeof saved.access_token !== 'string' ||
                typeof saved.refresh_token !== 'string' ||
                !Number.isFinite(saved.expires_at) ||
                typeof saved.user?.id !== 'string') return null;
            return saved;
        } catch (error) {
            console.warn('Saved catalogue admin session could not be read.', error);
            sessionStorage.removeItem(sessionKey);
            return null;
        }
    };

    const saveSession = session => {
        try {
            sessionStorage.setItem(sessionKey, JSON.stringify({
                ...session,
                expires_at: Date.now() + Number(session.expires_in || 3600) * 1000
            }));
        } catch (error) {
            console.warn('Catalogue admin session could not be saved in this tab.', error);
        }
    };

    const clearSession = () => sessionStorage.removeItem(sessionKey);

    const signIn = async (email, password) => {
        const session = await request('/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
            throw new Error('Supabase did not return a valid sign-in session.');
        }
        saveSession(session);
        return getSession();
    };

    const refreshSession = async session => {
        const updated = await request('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        if (!updated?.access_token || !updated?.refresh_token) {
            throw new Error('Supabase could not refresh the admin session. Please sign in again.');
        }
        saveSession(updated);
        return getSession();
    };

    const authorizedSession = async () => {
        let session = getSession();
        if (!session) throw new Error('Please sign in again to continue.');
        if (session.expires_at <= Date.now() + 30000) session = await refreshSession(session);
        return session;
    };

    const adminSession = async session => {
        const result = await request(`/rest/v1/catalogue_admins?select=user_id&user_id=eq.${encodeURIComponent(session.user.id)}`, {
            token: session.access_token
        });
        return Array.isArray(result) && result.some(admin => admin.user_id === session.user.id);
    };

    const listProducts = async ({ admin = false } = {}) => {
        const session = admin ? await authorizedSession() : null;
        return request('/rest/v1/catalogue_products?select=id,name,description,price,product_type,tags,image_path,active,created_at&order=created_at.desc', {
            token: session?.access_token
        });
    };

    const createProduct = async ({ name, description, price, productType, tags, image }) => {
        const session = await authorizedSession();
        const extension = allowedImageTypes.get(image?.type);
        if (!extension) throw new Error('Choose a JPEG, PNG, or WebP product photo.');
        if (image.size <= 0) throw new Error('Choose a product photo that is not empty.');
        if (image.size > 5 * 1024 * 1024) throw new Error('Product photos must be 5 MB or smaller.');
        if (!Number.isFinite(price) || price <= 0 || price > 9999999999.99) {
            throw new Error('Enter a valid product price greater than zero and no more than K9,999,999,999.99.');
        }
        if (!['fragrance', 'watch'].includes(productType)) throw new Error('Choose a valid product type.');
        if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 120) {
            throw new Error('Product names must be between 1 and 120 characters.');
        }
        if (typeof description !== 'string' || description.trim().length < 1 || description.trim().length > 700) {
            throw new Error('Descriptions must be between 1 and 700 characters.');
        }
        if (!Array.isArray(tags) || tags.length > 5 ||
            tags.some(tag => typeof tag !== 'string' || !/^[a-z0-9-]{1,24}$/.test(tag))) {
            throw new Error('Use up to five category tags containing letters, numbers, or hyphens.');
        }

        const imagePath = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
        const encodedImagePath = imagePath.split('/').map(encodeURIComponent).join('/');
        await request(`/storage/v1/object/catalogue-product-images/${encodedImagePath}`, {
            method: 'POST',
            token: session.access_token,
            body: image,
            headers: {
                'Content-Type': image.type,
                'Cache-Control': '3600',
                'x-upsert': 'false'
            }
        });

        try {
            const rows = await request('/rest/v1/catalogue_products', {
                method: 'POST',
                token: session.access_token,
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    price,
                    product_type: productType,
                    tags,
                    image_path: imagePath
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                }
            });
            if (!Array.isArray(rows) || rows.length !== 1) {
                throw new Error('The product image uploaded, but Supabase did not confirm the product was saved.');
            }
            return rows[0];
        } catch (error) {
            try {
                await request(`/storage/v1/object/catalogue-product-images/${encodedImagePath}`, {
                    method: 'DELETE',
                    token: session.access_token
                });
            } catch (cleanupError) {
                console.error('The uploaded image could not be cleaned up after product save failed.', cleanupError);
                throw new Error(`${error.message} The uploaded image also could not be removed; review storage for ${imagePath}.`);
            }
            throw error;
        }
    };

    const publicImageUrl = imagePath => {
        const encodedPath = String(imagePath).split('/').map(encodeURIComponent).join('/');
        return `${supabaseUrl}/storage/v1/object/public/catalogue-product-images/${encodedPath}`;
    };

    const signOut = async () => {
        const session = getSession();
        try {
            if (session) {
                await request('/auth/v1/logout', {
                    method: 'POST',
                    token: session.access_token
                });
            }
        } finally {
            clearSession();
        }
    };

    window.GioCatalogueApi = {
        isConfigured,
        configError,
        getSession,
        signIn,
        signOut,
        adminSession,
        authorizedSession,
        listProducts,
        createProduct,
        publicImageUrl
    };
})();

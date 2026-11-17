(() => {
    const menuButton = document.querySelector('.site-header .menu-toggle');
    const navigation = document.querySelector('.site-header .nav-links');
    if (!menuButton || !navigation) return;

    const closeMenu = () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open menu');
        menuButton.textContent = '☰';
        navigation.classList.remove('is-open');
    };

    menuButton.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuButton.textContent = open ? '×' : '☰';
        navigation.classList.toggle('is-open', open);
    });

    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
})();

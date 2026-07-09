/* ===== FAQ ACCORDION ===== */
(function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!faqItems.length) return;
    
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (!questionBtn) return;
        
        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items (accordion behavior)
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherBtn = otherItem.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            questionBtn.setAttribute('aria-expanded', !isActive);
        });
        
        // Keyboard accessibility - Enter and Space keys
        questionBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                questionBtn.click();
            }
        });
    });
    
    // Open first FAQ item by default for better UX
    const firstItem = faqItems[0];
    if (firstItem) {
        firstItem.classList.add('active');
        const firstBtn = firstItem.querySelector('.faq-question');
        if (firstBtn) firstBtn.setAttribute('aria-expanded', 'true');
    }
})();

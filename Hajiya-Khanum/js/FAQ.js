(function() {
    'use strict';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFaqAccordion);
    } else {
        initFaqAccordion();
    }
    
    function initFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        if (!faqItems.length) return;
        
        faqItems.forEach((item, index) => {
            const questionBtn = item.querySelector('.faq-question');
            if (!questionBtn) return;
            
            questionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isActive = item.classList.contains('active');
                
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherBtn = otherItem.querySelector('.faq-question');
                        if (otherBtn) {
                            otherBtn.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
                
                item.classList.toggle('active');
                questionBtn.setAttribute('aria-expanded', !isActive);
            });
            
            questionBtn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    questionBtn.click();
                }
            });
        });
        
        const firstItem = faqItems[0];
        if (firstItem) {
            setTimeout(() => {
                firstItem.classList.add('active');
                const firstBtn = firstItem.querySelector('.faq-question');
                if (firstBtn) {
                    firstBtn.setAttribute('aria-expanded', 'true');
                }
            }, 100);
        }
    }
})();

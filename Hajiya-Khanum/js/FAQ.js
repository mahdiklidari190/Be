  <!-- FAQ Accordion JavaScript -->
    (function() {
        'use strict';
        
        // Wait for DOM to be fully loaded
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
                
                // Add click event listener
                questionBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isActive = item.classList.contains('active');
                    
                    // Close all other items (accordion behavior)
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                            const otherBtn = otherItem.querySelector('.faq-question');
                            if (otherBtn) {
                                otherBtn.setAttribute('aria-expanded', 'false');
                            }
                        }
                    });
                    
                    // Toggle current item
                    item.classList.toggle('active');
                    questionBtn.setAttribute('aria-expanded', !isActive);
                });
                
                // Keyboard accessibility
                questionBtn.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        questionBtn.click();
                    }
                });
            });
            
            // Open first FAQ item by default
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

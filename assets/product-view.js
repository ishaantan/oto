(function() {
  'use strict';
  
  class ProductViewParallax {
    constructor(sectionId) {
      this.sectionId = sectionId;
      this.section = document.querySelector(`.product-view-${sectionId}`);
      this.image1 = this.section?.querySelector('.product-view__image-1');
      this.isMobile = window.innerWidth <= 749;
      this.rafId = null;
      this.isActive = false;
      
      if (this.section && this.image1 && !this.isMobile) {
        this.init();
      }
    }
    
    init() {
      // Attach scroll listener
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      window.addEventListener('resize', this.onResize.bind(this), { passive: true });
      
      // Initial calculation
      this.update();
      
      // Use IntersectionObserver to optimize performance
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isActive = entry.isIntersecting;
            if (this.isActive) {
              this.update();
            }
          });
        }, {
          rootMargin: '50px',
          threshold: [0, 0.25, 0.5, 0.75, 1]
        });
        
        this.observer.observe(this.section);
      }
    }
    
    onScroll() {
      if (this.isMobile || !this.image1) {
        return;
      }
      
      // Use requestAnimationFrame for smooth updates
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      
      this.rafId = requestAnimationFrame(() => {
        this.update();
      });
    }
    
    onResize() {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 749;
      
      if (wasMobile !== this.isMobile) {
        if (this.isMobile) {
          this.cleanup();
        } else {
          this.init();
        }
      } else {
        this.update();
      }
    }
    
    update() {
      if (!this.image1 || this.isMobile) {
        return;
      }
      
      const rect = this.section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Calculate scroll progress using parallax effect
      // Progress: 0 = section just entered, 1 = section fully scrolled
      let progress = 0;
      
      // Check if section is in viewport
      if (rect.bottom > 0 && rect.top < windowHeight) {
        // Section is visible
        // Calculate based on how much section has scrolled through viewport
        const scrollStart = windowHeight; // When section top reaches viewport bottom
        const scrollEnd = -sectionHeight; // When section bottom reaches viewport top
        const scrollRange = scrollStart - scrollEnd;
        const scrolled = scrollStart - rect.top;
        
        progress = scrolled / scrollRange;
        progress = Math.max(0, Math.min(1, progress));
      } else if (rect.top >= windowHeight) {
        // Section hasn't entered yet
        progress = 0;
      } else if (rect.bottom <= 0) {
        // Section scrolled past
        progress = 1;
      }
      
      // Apply clip-path: reveal from top to bottom
      // clip-path: inset(top right bottom left)
      // progress = 0: inset(100% 0 0 0) - completely hidden
      // progress = 1: inset(0% 0 0 0) - fully visible
      const clipValue = (1 - progress) * 100;
      this.image1.style.clipPath = `inset(${clipValue}% 0 0 0)`;
    }
    
    cleanup() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      
      if (this.image1) {
        this.image1.style.clipPath = '';
      }
    }
  }
  
  // Initialize function
  function initProductViewSections() {
    const sections = document.querySelectorAll('[class*="product-view-"][data-section-id]');
    
    sections.forEach(section => {
      const sectionId = section.getAttribute('data-section-id');
      if (sectionId) {
        try {
          new ProductViewParallax(sectionId);
        } catch (error) {
          console.error('Error initializing ProductViewParallax:', error);
        }
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductViewSections);
  } else {
    // DOM already loaded
    initProductViewSections();
  }
  
  // Also try after a short delay to catch dynamically loaded content
  setTimeout(initProductViewSections, 500);
  
  // Handle Shopify theme editor
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', (event) => {
      const sectionId = event.detail.sectionId;
      setTimeout(() => {
        try {
          new ProductViewParallax(sectionId);
        } catch (error) {
          console.error('Error initializing ProductViewParallax in editor:', error);
        }
      }, 100);
    });
  }
  
  // Expose for debugging
  window.ProductViewParallax = ProductViewParallax;
})();

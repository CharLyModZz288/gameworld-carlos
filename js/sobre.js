
function checkDirectAccess() {
try {
    const referrer = document.referrer;
    
    if (!referrer) {
    console.log('Acceso directo por URL detectado - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
    console.log('Acceso desde dominio externo detectado - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
    console.log('Acceso desde página no autorizada - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    console.log('Acceso permitido - Navegación interna');
    
    document.addEventListener('DOMContentLoaded', function() {
    document.body.style.overflow = 'auto';
    });
    
    return true;
} catch (error) {
    console.error('Error en verificación:', error);
    return true;
}
}

checkDirectAccess();

(function() {
      'use strict';
      
      // Control de acceso
      const accessCheck = document.getElementById('access-check');
      setTimeout(() => {
        if (accessCheck) {
          accessCheck.style.opacity = '0';
          setTimeout(() => {
            accessCheck.style.display = 'none';
          }, 300);
        }
        document.body.classList.add('access-allowed');
      }, 1000);
      
      // Loader con progreso simulado
      window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        const progressBar = document.querySelector('.loader-progress');
        
        if (progressBar) {
          let width = 0;
          const interval = setInterval(() => {
            if (width >= 100) {
              clearInterval(interval);
            } else {
              width += 10;
              progressBar.style.width = width + '%';
            }
          }, 50);
        }
        
        if (loader) {
          setTimeout(() => {
            loader.classList.add('hidden');
            document.body.classList.add('fade-in');
          }, 500);
        }
      });
      
      // Menú móvil
      const menuToggle = document.querySelector('.menu-toggle');
      const navLinks = document.querySelector('.nav-links');
      
      if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
          const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
          menuToggle.setAttribute('aria-expanded', !expanded);
          navLinks.classList.toggle('show');
        });
      }
      
      // Animación de estadísticas al hacer scroll
      const animateNumbers = () => {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'));
          const rect = stat.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisible && !stat.classList.contains('animated')) {
            stat.classList.add('animated');
            let current = 0;
            const increment = target / 30;
            const updateNumber = () => {
              if (current < target) {
                current += increment;
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateNumber);
              } else {
                stat.textContent = target;
              }
            };
            updateNumber();
          }
        });
      };
      
      // Scroll reveal mejorado
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
      
      window.addEventListener('scroll', animateNumbers);
      window.addEventListener('load', animateNumbers);
      
      // Prefetch de páginas importantes
      if ('connection' in navigator && navigator.connection.saveData === false) {
        const links = ['catalogo.html', 'playlists.html', 'merch.html'];
        links.forEach(link => {
          const prefetch = document.createElement('link');
          prefetch.rel = 'prefetch';
          prefetch.href = link;
          document.head.appendChild(prefetch);
        });
      }
    })();
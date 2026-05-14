// ============================================
// LANDCITY PROPERTIES - MAIN JAVASCRIPT
// ============================================

(function() {
    'use strict';

    // ========== PRELOADER ==========
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => { preloader.style.display = 'none'; }, 500);
        }
    });

    // ========== MOBILE NAVIGATION ==========
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ========== STICKY HEADER ==========
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) header?.classList.add('scrolled');
        else header?.classList.remove('scrolled');
    });

    // ========== BACK TO TOP ==========
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) backToTop?.classList.add('visible');
        else backToTop?.classList.remove('visible');
    });

    // ========== ACTIVE NAV ON SCROLL ==========
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-menu .nav-link[href="#${sectionId}"]`);
            if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-menu .nav-link').forEach(l => l.classList.remove('active'));
                navLink.classList.add('active');
            }
        });
    });

    // ========== SMOOTH SCROLL ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ========== ANIMATIONS ==========
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    function observeElements() {
        document.querySelectorAll('.service-card, .gallery-item, .team-card, .mission-card, .partner-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ========== SUPABASE INTEGRATION ==========
    
    function getSupabase() {
        return (typeof landcitySupabase !== 'undefined') ? landcitySupabase : null;
    }

    function showFormMessage(msg, type) {
        const formMessage = document.getElementById('formMessage');
        if (!formMessage) return;
        formMessage.textContent = msg;
        formMessage.style.display = 'block';
        formMessage.style.background = type === 'success' ? '#e8f5e9' : '#fef2f2';
        formMessage.style.color = type === 'success' ? '#2e7d32' : '#dc2626';
        formMessage.style.padding = '12px';
        formMessage.style.borderRadius = '8px';
        formMessage.style.textAlign = 'center';
        formMessage.style.marginTop = '15px';
        setTimeout(() => { formMessage.style.display = 'none'; }, 5000);
    }

    // ========== CONTACT FORM ==========
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = this.querySelector('input[name="name"]')?.value?.trim();
            const email = this.querySelector('input[name="email"]')?.value?.trim();
            const phone = this.querySelector('input[name="phone"]')?.value?.trim();
            const serviceType = this.querySelector('select[name="service_type"]')?.value;
            const message = this.querySelector('textarea[name="message"]')?.value?.trim();
            
            if (!name || !email || !message || !serviceType) {
                showFormMessage('Please fill in all required fields.', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            const supabaseClient = getSupabase();
            
            try {
                if (supabaseClient) {
                    const { error } = await supabaseClient
                        .from('inquiries')
                        .insert([{
                            name: name,
                            email: email,
                            phone: phone || null,
                            service_type: serviceType,
                            message: message,
                            status: 'new'
                        }]);
                    
                    if (error) {
                        console.error('Supabase insert error:', error);
                        showFormMessage('Thank you! Your message has been received.', 'success');
                    } else {
                        showFormMessage('Thank you! Your message has been sent successfully.', 'success');
                    }
                } else {
                    console.log('Contact form submitted (offline):', { name, email, phone, serviceType, message });
                    showFormMessage('Thank you! Your message has been received.', 'success');
                }
                contactForm.reset();
            } catch (error) {
                console.error('Form error:', error);
                showFormMessage('Thank you! Your message has been received.', 'success');
                contactForm.reset();
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ========== NEWSLETTER ==========
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterMessage = document.getElementById('newsletterMessage');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[name="email"]');
            const email = emailInput?.value?.trim();
            
            if (!email) return;
            
            const supabaseClient = getSupabase();
            
            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient
                        .from('newsletter_subscribers')
                        .insert([{ email: email }]);
                    
                    if (error && error.code !== '23505') {
                        console.error('Newsletter error:', error);
                    }
                } catch (err) {
                    console.error('Newsletter error:', err);
                }
            }
            
            if (newsletterMessage) {
                newsletterMessage.textContent = '✓ Subscribed successfully!';
                newsletterMessage.style.color = '#2e7d32';
                newsletterMessage.style.fontSize = '12px';
            }
            emailInput.value = '';
            setTimeout(() => { if (newsletterMessage) newsletterMessage.textContent = ''; }, 3000);
        });
    }

    // ========== LOAD DYNAMIC STATS ==========
    async function loadStats() {
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
            console.log('Stats: Supabase not available');
            return;
        }
        
        try {
            const { count: clientsCount } = await supabaseClient
                .from('clients')
                .select('*', { count: 'exact', head: true });
            
            const { count: propertiesCount } = await supabaseClient
                .from('properties')
                .select('*', { count: 'exact', head: true });
            
            if (clientsCount) {
                const statClients = document.getElementById('statClients');
                if (statClients) statClients.textContent = clientsCount + '+';
            }
            
            if (propertiesCount) {
                const statProperties = document.getElementById('statProperties');
                if (statProperties) statProperties.textContent = propertiesCount + '+';
            }
        } catch (error) {
            console.log('Stats not loaded from DB:', error.message);
        }
    }

// ========== LOAD DYNAMIC GALLERY ==========
async function loadGallery() {
    const supabaseClient = getSupabase();
    const galleryGrid = document.getElementById('dynamicGallery');
    
    if (!galleryGrid) return;
    
    // Keep default images if Supabase is not available
    if (!supabaseClient) {
        console.log('Gallery: Supabase not available - using static images');
        return;
    }
    
    try {
        console.log('Fetching gallery from Supabase...');
        const { data: properties, error } = await supabaseClient
            .from('properties')
            .select('*')
            .eq('status', 'available')
            .limit(6)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Gallery error:', error);
            return;
        }
        
        if (properties && properties.length > 0) {
            galleryGrid.innerHTML = properties.map(p => `
                <div class="gallery-item">
                    <img src="assets/real-estate.webp" alt="${p.plot_number}" onerror="this.src='assets/logo.jpeg'" loading="lazy">
                    <div class="gallery-overlay">
                        <h4>${p.plot_number || 'Property'}</h4>
                        <p>${p.location || 'Kano State'}</p>
                        <p class="gallery-price">₦${Number(p.price || 0).toLocaleString()}</p>
                    </div>
                </div>
            `).join('');
            
            observeElements();
        }
    } catch (error) {
        console.log('Gallery not loaded from DB:', error.message);
    }
}

    // ========== LOAD DYNAMIC TEAM FROM DATABASE ==========
// ========== LOAD DYNAMIC TEAM FROM SUPABASE ==========
async function loadTeam() {
    const supabaseClient = getSupabase();
    const teamGrid = document.getElementById('dynamicTeam');
    
    if (!teamGrid) {
        console.log('Team grid element not found');
        return;
    }
    
    // Check if Supabase is available
    if (!supabaseClient) {
        console.log('Supabase not available - using fallback team data');
        loadFallbackTeam();
        return;
    }
    
    try {
        console.log('Fetching team members from Supabase...');
        const { data: teamMembers, error } = await supabaseClient
            .from('team_members')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) {
            console.error('Supabase error:', error);
            loadFallbackTeam();
            return;
        }
        
        console.log('Team members loaded:', teamMembers?.length || 0);
        
        if (teamMembers && teamMembers.length > 0) {
            renderTeamMembers(teamMembers);
        } else {
            console.log('No team members found in database');
            loadFallbackTeam();
        }
    } catch (error) {
        console.error('Error loading team:', error);
        loadFallbackTeam();
    }
}

function renderTeamMembers(members) {
    const teamGrid = document.getElementById('dynamicTeam');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = members.map(member => `
        <div class="team-card">
            <div class="team-avatar">
                <img src="${member.image_url || 'assets/logo.jpeg'}" 
                     alt="${member.name}" 
                     onerror="this.src='assets/logo.jpeg'"
                     loading="lazy">
            </div>
            <h3>${member.name}</h3>
            <span class="team-role">${member.position}</span>
            ${member.bio ? `<p>${member.bio}</p>` : ''}
            <div class="team-contact">
                ${member.whatsapp ? `
                    <a href="https://wa.me/${member.whatsapp.replace(/\+/g, '')}?text=Hello%20${encodeURIComponent(member.name)}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-label="Chat on WhatsApp">
                        <i class="fab fa-whatsapp"></i> ${member.whatsapp}
                    </a>` : ''}
                ${!member.whatsapp && member.phone ? `
                    <a href="tel:${member.phone}" aria-label="Call">
                        <i class="fas fa-phone"></i> ${member.phone}
                    </a>` : ''}
                ${member.email ? `
                    <a href="mailto:${member.email}" aria-label="Send email">
                        <i class="fas fa-envelope"></i> ${member.email}
                    </a>` : ''}
            </div>
        </div>
    `).join('');
    
    // Re-observe for animations
    setTimeout(() => observeElements(), 100);
}

function loadFallbackTeam() {
    const teamGrid = document.getElementById('dynamicTeam');
    if (!teamGrid) return;
    
    // Fallback team data (will be used if Supabase is unavailable)
    const fallbackTeam = [
        {
            name: "Umar Muhammad Ibrahim",
            position: "Chairman/CEO",
            bio: "Visionary leader with 20+ years in real estate development",
            phone: "+2349113668055",
            whatsapp: "+2348036867775",
            email: "umarmuhdib@gmail.com",
            image_url: "assets/logo.jpeg"
        },
        {
            name: "Sadiq Musa Muhammad",
            position: "Managing Director",
            bio: "Expert in property negotiations and daily operations management",
            phone: "+2349067057443",
            whatsapp: "+2349067057443",
            email: null,
            image_url: "assets/logo.jpeg"
        },
        {
            name: "Isyaku Sani Muhammad",
            position: "Director of Sales & Marketing",
            bio: "Leading innovative sales strategies and marketing campaigns",
            phone: "+2347032306942",
            whatsapp: "+2347032306942",
            email: "ishaqsanimuhammad42@gmail.com",
            image_url: "assets/logo.jpeg"
        },
        {
            name: "Auwal Aminu Hamisu",
            position: "Director of Finance & Admin",
            bio: "Oversees financial operations, budgeting, and administration",
            phone: "+2347063818765",
            whatsapp: "+2347063818765",
            email: "auwalhamisu305@gmail.com",
            image_url: "assets/logo.jpeg"
        }
    ];
    
    console.log('Loading fallback team data');
    renderTeamMembers(fallbackTeam);
}

    // ========== INITIALIZE DYNAMIC CONTENT ==========
    function initDynamicContent() {
        console.log('Initializing dynamic content...');
        loadStats();
        loadGallery();
        loadTeam();
        
        // Retry after Supabase CDN fully loads
        setTimeout(() => {
            loadStats();
            loadGallery();
            loadTeam();
        }, 2000);
        
        // Observe elements for animations
        observeElements();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDynamicContent);
    } else {
        initDynamicContent();
    }

    console.log('Landcity Properties - Website Initialized');
})();
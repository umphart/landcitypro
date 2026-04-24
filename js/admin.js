// ============================================
// LANDCITY PROPERTIES - ADMIN JAVASCRIPT
// ============================================

(function() {
    'use strict';

    // Check authentication
    function checkAuth() {
        const isLoggedIn = sessionStorage.getItem('landcityAdminLoggedIn');
        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Set admin username
        const username = sessionStorage.getItem('landcityAdminUser') || 'Admin User';
        const usernameElements = document.querySelectorAll('#adminUsername, #headerUsername');
        usernameElements.forEach(el => {
            if (el) el.textContent = username;
        });
        
        return true;
    }

    // Logout function
    function logout() {
        sessionStorage.removeItem('landcityAdminLoggedIn');
        sessionStorage.removeItem('landcityAdminUser');
        window.location.href = 'login.html';
    }

    // Initialize if authenticated
    if (!checkAuth()) return;

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Page Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-page]');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));
            
            // Show selected page
            const pageId = this.getAttribute('data-page') + '-page';
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Update page title
            if (pageTitle) {
                const pageName = this.querySelector('span').textContent;
                pageTitle.textContent = pageName;
            }
        });
    });

    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.getElementById('mobileToggle');
    const adminSidebar = document.getElementById('adminSidebar');

    function toggleSidebar() {
        adminSidebar?.classList.toggle('open');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (adminSidebar && 
                !adminSidebar.contains(e.target) && 
                e.target !== sidebarToggle && 
                e.target !== mobileToggle) {
                adminSidebar.classList.remove('open');
            }
        }
    });

    console.log('Landcity Properties - Admin Panel Initialized');
})();
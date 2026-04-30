// ============================================
// LANDCITY PROPERTIES - ADMIN JAVASCRIPT
// ============================================

(function() {
    'use strict';

    // ========== AUTH CHECK ==========
    if (sessionStorage.getItem('landcityAdminLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const username = sessionStorage.getItem('landcityAdminUser') || 'Admin';
    const fullName = sessionStorage.getItem('landcityAdminFullName') || 'Admin User';
    
    // Set header profile
    const headerUsername = document.getElementById('headerUsername');
    const profileInitial = document.getElementById('profileInitial');
    if (headerUsername) headerUsername.textContent = fullName;
    if (profileInitial) profileInitial.textContent = fullName.charAt(0).toUpperCase();

    // ========== HELPER FUNCTIONS ==========
    function getSupabase() {
        return (typeof landcitySupabase !== 'undefined') ? landcitySupabase : null;
    }

    function formatCurrency(amount) {
        return '₦' + Number(amount || 0).toLocaleString('en-NG');
    }

    // ========== SIDEBAR TOGGLE ==========
    const adminSidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.innerWidth > 768) {
                adminSidebar?.classList.toggle('collapsed');
            } else {
                adminSidebar?.classList.toggle('open');
                sidebarOverlay?.classList.toggle('show');
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            adminSidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('show');
        });
    }

    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                adminSidebar?.classList.remove('open');
                sidebarOverlay?.classList.remove('show');
            }
        });
    });

    document.getElementById('mobileToggle')?.addEventListener('click', function() {
        adminSidebar?.classList.toggle('open');
        sidebarOverlay?.classList.toggle('show');
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebarOverlay?.classList.remove('show');
            adminSidebar?.classList.remove('open');
        }
    });

    // ========== LOGOUT ==========
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });

    // ========== PAGE NAVIGATION ==========
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-page]');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            const pageId = this.getAttribute('data-page') + '-page';
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                loadPageData(this.getAttribute('data-page'));
            }
            if (pageTitle) {
                pageTitle.textContent = this.querySelector('span').textContent;
            }
        });
    });

    window.navigateTo = function(pageName) {
        const navLink = document.querySelector(`.sidebar-nav a[data-page="${pageName}"]`);
        if (navLink) navLink.click();
    };

    // ========== LOAD PAGE DATA ==========
    function loadPageData(page) {
        switch(page) {
            case 'dashboard': loadDashboard(); break;
            case 'properties': loadProperties(); break;
            case 'clients': loadClients(); break;
            case 'payments': loadPayments(); break;
            case 'inquiries': loadInquiries(); break;
            case 'team': loadTeam(); break;
            case 'settings': break;
        }
    }

    // ========== DASHBOARD ==========
    async function loadDashboard() {
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
            console.log('Supabase not available');
            return;
        }

        try {
            const { count: totalProps } = await supabaseClient.from('properties').select('*', { count: 'exact', head: true });
            const { count: soldProps } = await supabaseClient.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'sold');
            const { count: available } = await supabaseClient.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'available');
            const { count: newInquiries } = await supabaseClient.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new');
            const { count: totalClients } = await supabaseClient.from('clients').select('*', { count: 'exact', head: true });
            const { data: payments } = await supabaseClient.from('payments').select('amount');
            const totalRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const { count: pendingCount } = await supabaseClient.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active');

            setText('dashTotalProperties', totalProps || '0');
            setText('dashSoldProperties', soldProps || '0');
            setText('dashAvailable', available || '0');
            setText('dashInquiries', newInquiries || '0');
            setText('dashTotalClients', totalClients || '0');
            setText('dashRevenue', formatCurrency(totalRevenue));
            setText('dashPending', pendingCount || '0');

            const { data: recent } = await supabaseClient.from('inquiries').select('*').order('created_at', { ascending: false }).limit(5);
            const tbody = document.getElementById('recentInquiries');
            if (tbody) {
                if (recent && recent.length > 0) {
                    tbody.innerHTML = recent.map(r => `
                        <tr>
                            <td>${r.name}</td>
                            <td>${r.email}</td>
                            <td>${new Date(r.created_at).toLocaleDateString()}</td>
                            <td><span class="status ${r.status}">${r.status}</span></td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No inquiries yet</td></tr>';
                }
            }
        } catch (error) {
            console.error('Dashboard error:', error);
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // ========== PROPERTIES ==========
    async function loadProperties() {
        const supabaseClient = getSupabase();
        const tbody = document.getElementById('propertiesTable');
        if (!supabaseClient || !tbody) return;

        try {
            const { data } = await supabaseClient.from('properties').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(p => `
                    <tr>
                        <td><strong>${p.plot_number}</strong></td>
                        <td>${p.property_type || 'plot'}</td>
                        <td>${p.layout_name || '-'}</td>
                        <td>${p.plot_size || '-'}</td>
                        <td>${p.location || 'Kano State'}</td>
                        <td>${formatCurrency(p.price)}</td>
                        <td><span class="status ${p.status}">${p.status}</span></td>
                        <td>${p.buyer_name || '-'}</td>
                        <td>
                            <button class="btn-icon" onclick="window.editProperty('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" onclick="window.deleteProperty('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No properties found</td></tr>';
            }
        } catch (error) {
            console.error('Properties error:', error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">Error loading properties</td></tr>';
        }
    }

    // ========== CLIENTS ==========
    async function loadClients() {
        const supabaseClient = getSupabase();
        const tbody = document.getElementById('clientsTable');
        if (!supabaseClient || !tbody) return;

        try {
            const { data: clients } = await supabaseClient.from('clients').select('*').order('created_at', { ascending: false });
            const { data: payments } = await supabaseClient.from('payments').select('*');
            
            if (clients && clients.length > 0) {
                const paymentsByClient = {};
                (payments || []).forEach(p => {
                    if (!paymentsByClient[p.client_id]) paymentsByClient[p.client_id] = [];
                    paymentsByClient[p.client_id].push(p);
                });
                
                tbody.innerHTML = clients.map(c => {
                    const clientPayments = paymentsByClient[c.id] || [];
                    const totalPaid = clientPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                    const balance = Number(c.plot_price || 0) - totalPaid;
                    return `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>${c.phone}</td>
                            <td>${c.plot_number}</td>
                            <td>${c.plot_size || '-'}</td>
                            <td>${formatCurrency(c.plot_price)}</td>
                            <td style="color:#059669">${formatCurrency(totalPaid)}</td>
                            <td style="color:${balance > 0 ? '#e65100' : '#2e7d32'}">${formatCurrency(balance)}</td>
                            <td>${c.payment_schedule || 12}mo</td>
                            <td><span class="status ${balance <= 0 ? 'completed' : 'active'}">${balance <= 0 ? 'Completed' : 'Active'}</span></td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No clients found</td></tr>';
            }
        } catch (error) {
            console.error('Clients error:', error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">Error loading clients</td></tr>';
        }
    }

    // ========== PAYMENTS ==========
    async function loadPayments() {
        const supabaseClient = getSupabase();
        const tbody = document.getElementById('paymentsTable');
        if (!supabaseClient || !tbody) return;

        try {
            const { data } = await supabaseClient
                .from('payments')
                .select('*, clients:client_id(name, phone, plot_number)')
                .order('payment_date', { ascending: false })
                .limit(100);
            
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(p => `
                    <tr>
                        <td>${new Date(p.payment_date).toLocaleDateString('en-NG')}</td>
                        <td><strong>${p.clients?.name || 'N/A'}</strong></td>
                        <td>${p.clients?.phone || '-'}</td>
                        <td>${p.clients?.plot_number || 'N/A'}</td>
                        <td><span class="status ${p.payment_type}">${p.payment_type === 'initial_deposit' ? 'Deposit' : 'Installment #' + (p.installment_number || '?')}</span></td>
                        <td>${(p.payment_method || '').replace('_', ' ')}</td>
                        <td style="color:#059669;font-weight:600">${formatCurrency(p.amount)}</td>
                        <td>${formatCurrency(p.remaining_balance)}</td>
                        <td><span class="status ${Number(p.remaining_balance) <= 0 ? 'completed' : 'pending'}">${Number(p.remaining_balance) <= 0 ? 'Paid' : 'Pending'}</span></td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">No payments found</td></tr>';
            }
        } catch (error) {
            console.error('Payments error:', error);
        }
    }

    // ========== INQUIRIES ==========
    async function loadInquiries() {
        const supabaseClient = getSupabase();
        const tbody = document.getElementById('inquiriesTable');
        if (!supabaseClient || !tbody) return;

        try {
            const { data } = await supabaseClient.from('inquiries').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(i => `
                    <tr>
                        <td>${new Date(i.created_at).toLocaleDateString('en-NG')}</td>
                        <td><strong>${i.name}</strong></td>
                        <td>${i.email}</td>
                        <td>${i.phone || '-'}</td>
                        <td>${i.service_type}</td>
                        <td>${(i.message || '').substring(0, 60)}...</td>
                        <td>
                            <select onchange="window.updateInquiryStatus('${i.id}', this.value)" class="status-select">
                                <option value="new" ${i.status === 'new' ? 'selected' : ''}>New</option>
                                <option value="read" ${i.status === 'read' ? 'selected' : ''}>Read</option>
                                <option value="responded" ${i.status === 'responded' ? 'selected' : ''}>Responded</option>
                                <option value="closed" ${i.status === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No inquiries found</td></tr>';
            }
        } catch (error) {
            console.error('Inquiries error:', error);
        }
    }

    window.updateInquiryStatus = async function(id, status) {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        await supabaseClient.from('inquiries').update({ status }).eq('id', id);
    };

    // ========== TEAM PHOTO HANDLING ==========
    let teamPhotoBase64 = null;

    window.previewTeamPhoto = function(input) {
        const file = input.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            alert('Photo must be less than 2MB');
            input.value = '';
            return;
        }
        
        const fileNameEl = document.getElementById('photoFileName');
        if (fileNameEl) fileNameEl.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            teamPhotoBase64 = e.target.result;
            const previewImg = document.getElementById('photoPreviewImg');
            const preview = document.getElementById('photoPreview');
            if (previewImg) previewImg.src = teamPhotoBase64;
            if (preview) preview.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    };

    window.removePhoto = function() {
        teamPhotoBase64 = null;
        const photoInput = document.getElementById('teamPhoto');
        const fileNameEl = document.getElementById('photoFileName');
        const preview = document.getElementById('photoPreview');
        if (photoInput) photoInput.value = '';
        if (fileNameEl) fileNameEl.textContent = 'No file chosen';
        if (preview) preview.style.display = 'none';
    };

    // ========== TEAM CRUD ==========
    window.showTeamForm = function(id) {
        const modal = document.getElementById('teamModal');
        if (!modal) return;
        modal.style.display = 'flex';
        
        const titleEl = document.getElementById('teamModalTitle');
        if (titleEl) titleEl.textContent = id ? 'Edit Team Member' : 'Add Team Member';
        
        const idEl = document.getElementById('teamMemberId');
        if (idEl) idEl.value = id || '';
        
        teamPhotoBase64 = null;
        
        const preview = document.getElementById('photoPreview');
        const fileNameEl = document.getElementById('photoFileName');
        const photoInput = document.getElementById('teamPhoto');
        
        if (preview) preview.style.display = 'none';
        if (fileNameEl) fileNameEl.textContent = 'No file chosen';
        if (photoInput) photoInput.value = '';
        
        if (!id) {
            const form = document.getElementById('teamForm');
            if (form) form.reset();
            return;
        }
        
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        supabaseClient.from('team_members').select('*').eq('id', id).single().then(({ data }) => {
            if (data) {
                setFieldValue('teamName', data.name);
                setFieldValue('teamPosition', data.position);
                setFieldValue('teamBio', data.bio);
                setFieldValue('teamPhone', data.phone);
                setFieldValue('teamWhatsapp', data.whatsapp);
                setFieldValue('teamEmail', data.email);
                setFieldValue('teamDisplayOrder', data.display_order);
                
                if (data.image_url) {
                    teamPhotoBase64 = data.image_url;
                    const previewImg = document.getElementById('photoPreviewImg');
                    if (previewImg) previewImg.src = data.image_url;
                    if (preview) preview.style.display = 'inline-block';
                    if (fileNameEl) fileNameEl.textContent = 'Current photo';
                }
            }
        });
    };

    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    window.closeTeamForm = function() {
        const modal = document.getElementById('teamModal');
        if (modal) modal.style.display = 'none';
        teamPhotoBase64 = null;
    };

    window.editTeamMember = function(id) { window.showTeamForm(id); };

    window.deleteTeamMember = async function(id) {
        if (!confirm('Delete this team member?')) return;
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        await supabaseClient.from('team_members').delete().eq('id', id);
        loadTeam();
    };

    // Team form submit
    document.getElementById('teamForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const id = document.getElementById('teamMemberId')?.value;
        const name = document.getElementById('teamName')?.value?.trim();
        const position = document.getElementById('teamPosition')?.value?.trim();
        
        if (!name || !position) {
            alert('Name and Position are required!');
            return;
        }
        
        const data = {
            name: name,
            position: position,
            bio: document.getElementById('teamBio')?.value?.trim() || null,
            phone: document.getElementById('teamPhone')?.value?.trim() || null,
            whatsapp: document.getElementById('teamWhatsapp')?.value?.trim() || null,
            email: document.getElementById('teamEmail')?.value?.trim() || null,
            image_url: teamPhotoBase64 || null,
            display_order: parseInt(document.getElementById('teamDisplayOrder')?.value || '0'),
        };

        try {
            if (id) {
                await supabaseClient.from('team_members').update(data).eq('id', id);
                alert('Team member updated!');
            } else {
                await supabaseClient.from('team_members').insert([data]);
                alert('Team member added!');
            }
            window.closeTeamForm();
            loadTeam();
        } catch (error) {
            console.error('Error saving team member:', error);
            alert('Error saving team member.');
        }
    });

    // Load team table
    async function loadTeam() {
        const supabaseClient = getSupabase();
        const tbody = document.getElementById('teamTable');
        if (!supabaseClient || !tbody) return;

        try {
            const { data } = await supabaseClient.from('team_members').select('*').order('display_order', { ascending: true });
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(m => `
                    <tr>
                        <td>
                            ${m.image_url 
                                ? `<img src="${m.image_url}" alt="${m.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">` 
                                : `<div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:600;font-size:14px">${(m.name || '?').charAt(0)}</div>`
                            }
                        </td>
                        <td><strong>${m.name}</strong></td>
                        <td>${m.position}</td>
                        <td>${m.phone || '-'}</td>
                        <td>${m.email || '-'}</td>
                        <td>${m.display_order || 0}</td>
                        <td>
                            <button class="btn-icon" onclick="window.editTeamMember('${m.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" onclick="window.deleteTeamMember('${m.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No team members found. Click "Add Team Member" to add one.</td></tr>';
            }
        } catch (error) {
            console.error('Team error:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Error loading team</td></tr>';
        }
    }

    // ========== PROPERTY CRUD ==========
    window.showPropertyForm = function(id) {
        const modal = document.getElementById('propertyModal');
        if (!modal) return;
        modal.style.display = 'flex';
        
        const titleEl = document.getElementById('propertyModalTitle');
        if (titleEl) titleEl.textContent = id ? 'Edit Property' : 'Add New Property';
        
        const idEl = document.getElementById('propertyId');
        if (idEl) idEl.value = id || '';
        
        if (!id) {
            const form = document.getElementById('propertyForm');
            if (form) form.reset();
            return;
        }
        
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        supabaseClient.from('properties').select('*').eq('id', id).single().then(({ data }) => {
            if (data) {
                setFieldValue('propPlotNumber', data.plot_number);
                setFieldValue('propType', data.property_type || 'plot');
                setFieldValue('propLayout', data.layout_name);
                setFieldValue('propSize', data.plot_size);
                setFieldValue('propLocation', data.location || 'Kano State');
                setFieldValue('propPrice', data.price);
                setFieldValue('propStatus', data.status || 'available');
                setFieldValue('propBuyerName', data.buyer_name);
                setFieldValue('propBuyerPhone', data.buyer_phone);
            }
        });
    };

    window.closePropertyForm = function() {
        const modal = document.getElementById('propertyModal');
        if (modal) modal.style.display = 'none';
    };

    window.editProperty = function(id) { window.showPropertyForm(id); };

    window.deleteProperty = async function(id) {
        if (!confirm('Delete this property?')) return;
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        await supabaseClient.from('properties').delete().eq('id', id);
        loadProperties();
        loadDashboard();
    };

    // Property form submit
    document.getElementById('propertyForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const id = document.getElementById('propertyId')?.value;
        const plotNumber = document.getElementById('propPlotNumber')?.value?.trim();
        
        if (!plotNumber) {
            alert('Plot Number is required!');
            return;
        }
        
        const data = {
            plot_number: plotNumber,
            property_type: document.getElementById('propType')?.value || 'plot',
            layout_name: document.getElementById('propLayout')?.value?.trim() || null,
            plot_size: document.getElementById('propSize')?.value?.trim() || null,
            location: document.getElementById('propLocation')?.value?.trim() || 'Kano State',
            price: parseFloat(document.getElementById('propPrice')?.value || '0'),
            status: document.getElementById('propStatus')?.value || 'available',
            buyer_name: document.getElementById('propBuyerName')?.value?.trim() || null,
            buyer_phone: document.getElementById('propBuyerPhone')?.value?.trim() || null,
        };

        try {
            if (id) {
                await supabaseClient.from('properties').update(data).eq('id', id);
                alert('Property updated!');
            } else {
                await supabaseClient.from('properties').insert([data]);
                alert('Property added!');
            }
            window.closePropertyForm();
            loadProperties();
            loadDashboard();
        } catch (error) {
            console.error('Error saving property:', error);
            alert('Error saving property: ' + (error.message || 'Unknown error'));
        }
    });

    // ========== EXPORT DATA ==========
    window.exportData = function() {
        alert('Export feature coming soon!');
    };

    // ========== INITIAL LOAD ==========
    loadDashboard();
    console.log('Landcity Admin Initialized');
})();
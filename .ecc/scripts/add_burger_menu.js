const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

// =========================================================================
// 1. CSS FOR MOBILE HAMBURGER BUTTON & DRAWER MENU
// =========================================================================
const burgerCss = `
        /* Mobile Hamburger Button & Drawer Navigation */
        .mobile-only-btn {
            display: none;
        }

        .header-desktop-actions {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        @media (max-width: 768px) {
            .mobile-only-btn {
                display: flex !important;
                align-items: center;
                justify-content: center;
            }
            .header-desktop-actions {
                display: none !important;
            }
        }

        #mobile-nav-drawer {
            display: none;
            position: fixed;
            top: 57px;
            right: 0;
            width: 290px;
            max-width: 85vw;
            background: var(--gemini-surface);
            border-left: 1px solid var(--gemini-border);
            border-bottom: 1px solid var(--gemini-border);
            border-radius: 0 0 0 16px;
            box-shadow: -6px 12px 32px rgba(0, 0, 0, 0.5);
            z-index: 350;
            flex-direction: column;
            overflow-y: auto;
            max-height: calc(100vh - 65px);
            transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease;
            transform: translateY(-8px);
            opacity: 0;
        }

        body.rtl #mobile-nav-drawer {
            right: auto;
            left: 0;
            border-left: none;
            border-right: 1px solid var(--gemini-border);
            border-radius: 0 0 16px 0;
            box-shadow: 6px 12px 32px rgba(0, 0, 0, 0.5);
        }

        #mobile-nav-drawer.open {
            display: flex !important;
            transform: translateY(0);
            opacity: 1;
        }

        .mobile-nav-header {
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--gemini-border);
            background: var(--gemini-bg);
        }

        .mobile-nav-title {
            font-size: 0.88rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--gemini-text-main);
        }

        .mobile-nav-list {
            display: flex;
            flex-direction: column;
            padding: 8px;
            gap: 4px;
        }

        .mobile-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            background: transparent;
            border: none;
            color: var(--gemini-text-main);
            font-size: 0.84rem;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            text-decoration: none;
            transition: background 0.15s ease, color 0.15s ease;
            width: 100%;
            box-sizing: border-box;
        }

        body.rtl .mobile-nav-item {
            text-align: right;
        }

        .mobile-nav-item:hover, .mobile-nav-item:active {
            background: var(--gemini-surface-hover);
            color: var(--sap-blue);
        }

        .mobile-nav-item svg {
            width: 18px;
            height: 18px;
            stroke: var(--gemini-text-muted);
            flex-shrink: 0;
            transition: stroke 0.15s;
        }

        .mobile-nav-item:hover svg, .mobile-nav-item:active svg {
            stroke: var(--sap-blue);
        }

        .mobile-nav-item-badge {
            margin-left: auto;
            font-size: 0.7rem;
            padding: 2px 7px;
            border-radius: 10px;
            background: var(--sap-blue-soft);
            color: var(--sap-blue);
            font-weight: 600;
            border: 1px solid var(--sap-blue-soft-border);
        }

        body.rtl .mobile-nav-item-badge {
            margin-left: 0;
            margin-right: auto;
        }

        .mobile-nav-divider {
            height: 1px;
            background: var(--gemini-border);
            margin: 4px 8px;
        }
`;

if (!content.includes('Mobile Hamburger Button & Drawer Navigation')) {
  content = content.replace('    </style>', `${burgerCss}\n    </style>`);
  console.log('✓ Burger menu CSS injected');
} else {
  console.log('• Burger menu CSS already present');
}

// =========================================================================
// 2. HEADER ACTIONS UPDATE (Add Burger Button & Wrap Desktop Actions)
// =========================================================================
const headerActionsTarget = `        <div class="header-actions">
            <button class="icon-btn" title="On-Device Defect Vision" onclick="openVisionModal()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button class="icon-btn" title="Standards & Specs Hub" onclick="openStandardsModal()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="icon-btn" title="Purge Cache & Refresh" onclick="forceCachePurge()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
            <button class="icon-btn" title="Toggle Dark/Light Mode" onclick="toggleTheme()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <a href="refiner.html" class="icon-btn" title="Database Refiner & AI Rule Studio" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
                <svg class="gemini-svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </a>
            <button class="icon-btn" title="Admin Settings" onclick="toggleAdminPanel()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
        </div>`;

const headerActionsReplacement = `        <div class="header-actions">
            <!-- Desktop Action Icons -->
            <div class="header-desktop-actions">
                <button class="icon-btn" title="On-Device Defect Vision" onclick="openVisionModal()">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <button class="icon-btn" title="Standards & Specs Hub" onclick="openStandardsModal()">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button class="icon-btn" title="Purge Cache & Refresh" onclick="forceCachePurge()">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                </button>
                <button class="icon-btn" title="Toggle Dark/Light Mode" onclick="toggleTheme()">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
                <a href="refiner.html" class="icon-btn" title="Database Refiner & AI Rule Studio" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                </a>
                <button class="icon-btn" title="Admin Settings" onclick="toggleAdminPanel()">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
            </div>

            <!-- Mobile Hamburger Menu Button -->
            <button class="icon-btn mobile-only-btn" id="mobile-menu-btn" title="Navigation Menu" onclick="toggleMobileNavMenu()">
                <svg class="gemini-svg" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
        </div>`;

if (content.includes(norm(headerActionsTarget))) {
  content = content.replace(norm(headerActionsTarget), norm(headerActionsReplacement));
  console.log('✓ Header desktop actions wrapped & mobile burger button added');
} else {
  console.error('✗ headerActionsTarget not found');
}

// =========================================================================
// 3. MOBILE NAV DRAWER ELEMENT IN HTML (Right after header)
// =========================================================================
const drawerMarkup = `    <!-- Mobile Navigation Drawer Menu -->
    <div id="mobile-nav-drawer">
        <div class="mobile-nav-header">
            <div class="mobile-nav-title">
                <svg class="gemini-svg" style="width:18px; height:18px; stroke:var(--sap-blue);" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
                <span>Inspecta Menu</span>
            </div>
            <button class="close-modal-btn" onclick="closeMobileNavMenu()" style="padding:2px 6px;">&times;</button>
        </div>
        <div class="mobile-nav-list">
            <button class="mobile-nav-item" onclick="toggleSourcesSidebar(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                <span>Sources & Specs</span>
                <span class="mobile-nav-item-badge" id="mobile-menu-active-scope">Active</span>
            </button>
            <button class="mobile-nav-item" onclick="openKnowledgeCurator(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Curate Database Chunks</span>
            </button>
            <button class="mobile-nav-item" onclick="openVisionModal(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>On-Device Defect Vision</span>
            </button>
            <button class="mobile-nav-item" onclick="openStandardsModal(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span>Standards & Specs Hub</span>
            </button>
            <a href="refiner.html" class="mobile-nav-item" style="text-decoration:none;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                <span>Database Refiner & AI Studio</span>
            </a>
            <div class="mobile-nav-divider"></div>
            <button class="mobile-nav-item" onclick="toggleTheme();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span>Toggle Dark / Light Mode</span>
            </button>
            <button class="mobile-nav-item" onclick="forceCachePurge(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Purge Cache & Reload</span>
            </button>
            <button class="mobile-nav-item" onclick="toggleAdminPanel(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Admin Settings</span>
            </button>
        </div>
    </div>`;

if (!content.includes('id="mobile-nav-drawer"')) {
  content = content.replace('    </header>', `    </header>\n${drawerMarkup}`);
  console.log('✓ Mobile navigation drawer markup injected');
} else {
  console.log('• Mobile navigation drawer already present');
}

// =========================================================================
// 4. JS HANDLERS FOR MOBILE MENU (toggleMobileNavMenu, closeMobileNavMenu, escape/backdrop handling)
// =========================================================================
const menuJs = `
        // Mobile Navigation Drawer Controls
        function toggleMobileNavMenu() {
            const drawer = document.getElementById('mobile-nav-drawer');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (!drawer) return;
            drawer.classList.toggle('open');
            const isOpen = drawer.classList.contains('open');

            if (backdrop) {
                if (isOpen) {
                    backdrop.classList.add('active');
                } else {
                    const sidebar = document.getElementById('notebooklm-sidebar');
                    if (!sidebar || sidebar.classList.contains('collapsed')) {
                        backdrop.classList.remove('active');
                    }
                }
            }

            // Sync active count in mobile menu
            const scopeBadge = document.getElementById('mobile-menu-active-scope');
            if (scopeBadge && selectedStandardsSet) {
                scopeBadge.textContent = selectedStandardsSet.size > 0 ? \`\${selectedStandardsSet.size} Active\` : 'All Code';
            }
        }

        function closeMobileNavMenu() {
            const drawer = document.getElementById('mobile-nav-drawer');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (drawer) drawer.classList.remove('open');
            if (backdrop) {
                const sidebar = document.getElementById('notebooklm-sidebar');
                if (!sidebar || sidebar.classList.contains('collapsed')) {
                    backdrop.classList.remove('active');
                }
            }
        }
`;

// Inject menu JS and update ESC/Backdrop handlers
const escTarget = `        // Global Keyboard Dismissal (Escape Key) & Backdrop Click Handler
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {`;

const escReplacement = `        // Global Keyboard Dismissal (Escape Key) & Backdrop Click Handler
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const mobileDrawer = document.getElementById('mobile-nav-drawer');
                if (mobileDrawer && mobileDrawer.classList.contains('open')) {
                    closeMobileNavMenu();
                    return;
                }`;

if (content.includes(norm(escTarget))) {
  content = content.replace(norm(escTarget), `${menuJs}\n${escReplacement}`);
  console.log('✓ Mobile menu JS functions injected & ESC handler updated');
} else {
  console.error('✗ escTarget not found');
}

// Update backdrop click to close mobile menu
const backdropClickTarget = `        // Click on Blurred Backdrop to Dismiss Modals
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('gemini-modal')) {
                e.target.style.display = 'none';
                const backdrop = document.getElementById('sidebar-backdrop');
                if (backdrop && window.innerWidth <= 768) backdrop.classList.remove('active');
            }
        });`;

const backdropClickReplacement = `        // Click on Blurred Backdrop to Dismiss Modals & Mobile Drawer
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('gemini-modal')) {
                e.target.style.display = 'none';
                const backdrop = document.getElementById('sidebar-backdrop');
                if (backdrop && window.innerWidth <= 768) backdrop.classList.remove('active');
                closeMobileNavMenu();
            }
            if (e.target && e.target.id === 'sidebar-backdrop') {
                closeMobileNavMenu();
            }
        });`;

if (content.includes(norm(backdropClickTarget))) {
  content = content.replace(norm(backdropClickTarget), norm(backdropClickReplacement));
  console.log('✓ Backdrop click updated to close mobile menu');
} else {
  console.error('✗ backdropClickTarget not found');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Burger button and mobile menu successfully added to index.html!');

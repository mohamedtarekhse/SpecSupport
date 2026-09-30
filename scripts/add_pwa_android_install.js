const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Add PWA Banner and Animation CSS
const pwaCss = `
        /* 📲 PWA Android & Mobile Install Banner */
        @keyframes pwaSlideUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        #pwa-install-banner {
            position: fixed;
            bottom: 84px;
            left: 16px;
            right: 16px;
            max-width: 460px;
            margin: 0 auto;
            background: var(--gemini-surface);
            border: 1px solid var(--sap-blue-soft-border);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
            border-radius: 14px;
            padding: 12px 16px;
            z-index: 999;
            animation: pwaSlideUp 0.35s cubic-bezier(0.2, 0, 0, 1);
            backdrop-filter: blur(10px);
        }
        .pwa-banner-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        .pwa-banner-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pwa-banner-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
`;

if (!html.includes('PWA Android & Mobile Install Banner')) {
    html = html.replace('.locaspec-header-pill {', `${pwaCss}\n        .locaspec-header-pill {`);
}

// 2. Add Header install button right after #locaspec-header-btn
const headerInstallBtn = `                <button class="icon-btn" id="header-pwa-install-btn" title="Install SpecSupport App on Android / Desktop" onclick="triggerPwaInstall()" style="color:#10B981; display:none;">
                    <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </button>`;

if (!html.includes('id="header-pwa-install-btn"')) {
    html = html.replace('id="locaspec-header-btn"', `id="locaspec-header-btn"`);
    html = html.replace('</button>\n                <button class="icon-btn" title="On-Device Defect Vision"', `</button>\n${headerInstallBtn}\n                <button class="icon-btn" title="On-Device Defect Vision"`);
}

// 3. Add Mobile Menu item in #mobile-nav-drawer
const mobileInstallItem = `            <button class="mobile-nav-item" id="mobile-pwa-install-btn" onclick="triggerPwaInstall(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                <span>Install App on Android</span>
                <span class="mobile-nav-item-badge" style="background:#10B981; color:#fff; font-weight:700;">Install</span>
            </button>`;

if (!html.includes('id="mobile-pwa-install-btn"')) {
    html = html.replace('<div class="mobile-nav-list">', `<div class="mobile-nav-list">\n${mobileInstallItem}`);
}

// 4. Add floating bottom banner and installation guide modal before </body>
const pwaBottomElements = `
    <!-- 📲 PWA Bottom Floating Mobile Install Banner -->
    <div id="pwa-install-banner" style="display:none;">
        <div class="pwa-banner-content">
            <div class="pwa-banner-info">
                <img src="./icon-192.png" width="38" height="38" style="border-radius:9px; box-shadow:0 2px 8px var(--sap-blue-glow);" alt="SpecSupport Logo">
                <div>
                    <div style="font-size:0.86rem; font-weight:700; color:var(--gemini-text-main);">Install SpecSupport App</div>
                    <div style="font-size:0.72rem; color:var(--gemini-text-muted);">Android PWA • 0ms launch & offline rig access</div>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button class="curator-btn primary" onclick="triggerPwaInstall()" style="padding:6px 14px; font-size:0.78rem;">Install</button>
                <button onclick="dismissPwaBanner()" style="background:none; border:none; color:var(--gemini-text-muted); font-size:1.3rem; cursor:pointer; padding:0 4px; line-height:1;">&times;</button>
            </div>
        </div>
    </div>

    <!-- 📲 PWA Installation Guide Modal (Android Chrome / Safari / Samsung) -->
    <div id="pwa-guide-modal" class="gemini-modal" style="display:none; z-index:1250;">
        <div class="gemini-modal-content" style="max-width:540px; width:92%; padding:22px; box-sizing:border-box;">
            <div class="modal-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="./icon-192.png" width="34" height="34" style="border-radius:8px;" alt="Logo">
                    <h3 style="margin:0; font-size:1.05rem;">Install SpecSupport on Android / Mobile</h3>
                </div>
                <button class="close-modal-btn" onclick="closePwaGuideModal()">&times;</button>
            </div>
            <div style="font-size:0.82rem; color:var(--gemini-text-muted); margin-bottom:14px; line-height:1.5;">
                SpecSupport is a certified Progressive Web App (PWA). You can install it on your home screen for instantaneous launch and 100% offline rig operation.
            </div>

            <div style="background:var(--gemini-bg); border:1px solid var(--gemini-border); border-radius:10px; padding:14px; margin-bottom:12px;">
                <div style="font-weight:700; color:var(--gemini-text-main); font-size:0.86rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                    <span>🤖 Android Chrome Installation:</span>
                </div>
                <ol style="margin:0 0 0 18px; padding:0; font-size:0.8rem; color:var(--gemini-text-muted); line-height:1.6;">
                    <li>Tap the <strong>Chrome menu (⋮)</strong> in the top-right corner.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> (تثبيت التطبيق / إضافة إلى الشاشة الرئيسية).</li>
                    <li>Confirm by clicking <strong>"Install"</strong>.</li>
                </ol>
            </div>

            <div style="background:var(--gemini-bg); border:1px solid var(--gemini-border); border-radius:10px; padding:14px; margin-bottom:14px;">
                <div style="font-weight:700; color:var(--gemini-text-main); font-size:0.86rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                    <span>⚡ Quick Android Shortcuts (Long-press icon):</span>
                </div>
                <ul style="margin:0 0 0 18px; padding:0; font-size:0.78rem; color:var(--gemini-text-muted); line-height:1.5;">
                    <li>🛰️ <strong>LocaSpec Rig</strong>: Jump straight to 0-byte offline engine</li>
                    <li>📁 <strong>Standards Hub</strong>: Direct access to 35 oil & gas standards</li>
                    <li>🔍 <strong>Defect Vision AI</strong>: Instant computer vision camera inspection</li>
                </ul>
            </div>

            <div style="display:flex; justify-content:flex-end;">
                <button class="curator-btn primary" onclick="closePwaGuideModal()">Got It!</button>
            </div>
        </div>
    </div>
`;

if (!html.includes('id="pwa-install-banner"')) {
    html = html.replace('</body>', `${pwaBottomElements}\n</body>`);
}

// 5. Add PWA JavaScript controller logic
const pwaControllerJs = `
        // =========================================================================
        // 📲 PWA ANDROID CHROME INSTALLATION & SHORTCUTS CONTROLLER
        // =========================================================================
        let deferredInstallPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            console.log('[SpecSupport PWA] beforeinstallprompt captured successfully.');
            showPwaInstallPrompts(true);
        });

        window.addEventListener('appinstalled', (evt) => {
            console.log('[SpecSupport PWA] App installed successfully on device.');
            deferredInstallPrompt = null;
            showPwaInstallPrompts(false);
            localStorage.setItem('specsupport_pwa_installed', 'true');
            dismissPwaBanner();
        });

        function showPwaInstallPrompts(show) {
            const headerBtn = document.getElementById('header-pwa-install-btn');
            const mobileBtn = document.getElementById('mobile-pwa-install-btn');
            const banner = document.getElementById('pwa-install-banner');
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('specsupport_pwa_installed') === 'true';

            if (isInstalled) {
                if (headerBtn) headerBtn.style.display = 'none';
                if (banner) banner.style.display = 'none';
                return;
            }

            if (headerBtn) headerBtn.style.display = show ? 'inline-flex' : 'none';

            // Show floating banner on mobile devices if not dismissed today
            const lastDismiss = localStorage.getItem('pwa_banner_dismissed');
            const isDismissedRecently = lastDismiss && (Date.now() - parseInt(lastDismiss)) < (24 * 60 * 60 * 1000);
            const isMobile = window.innerWidth <= 768 || /android|iphone|ipad/i.test(navigator.userAgent);

            if (banner) {
                if (show && isMobile && !isDismissedRecently) {
                    banner.style.display = 'block';
                } else if (!show) {
                    banner.style.display = 'none';
                }
            }
        }

        async function triggerPwaInstall() {
            if (deferredInstallPrompt) {
                try {
                    deferredInstallPrompt.prompt();
                    const { outcome } = await deferredInstallPrompt.userChoice;
                    console.log('[SpecSupport PWA] User install choice outcome:', outcome);
                    if (outcome === 'accepted') {
                        dismissPwaBanner();
                    }
                    deferredInstallPrompt = null;
                } catch(err) {
                    console.warn('[SpecSupport PWA] Install prompt error:', err);
                    openPwaGuideModal();
                }
            } else {
                openPwaGuideModal();
            }
        }

        function dismissPwaBanner() {
            const banner = document.getElementById('pwa-install-banner');
            if (banner) banner.style.display = 'none';
            localStorage.setItem('pwa_banner_dismissed', String(Date.now()));
        }

        function openPwaGuideModal() {
            const modal = document.getElementById('pwa-guide-modal');
            if (modal) modal.style.display = 'flex';
        }

        function closePwaGuideModal() {
            const modal = document.getElementById('pwa-guide-modal');
            if (modal) modal.style.display = 'none';
        }

        // Handle Launch Shortcuts from Android Home Screen (?mode=locaspec | ?mode=standards | ?mode=vision)
        function handlePwaShortcuts() {
            try {
                const params = new URLSearchParams(window.location.search);
                const mode = params.get('mode');
                if (mode === 'locaspec') {
                    setTimeout(() => openLocaSpecModal(), 400);
                } else if (mode === 'standards') {
                    setTimeout(() => openStandardsModal(), 400);
                } else if (mode === 'vision') {
                    setTimeout(() => openVisionModal(), 400);
                }
            } catch(e) {}
        }
`;

if (!html.includes('PWA ANDROID CHROME INSTALLATION & SHORTCUTS CONTROLLER')) {
    html = html.replace('// PWA Service Worker Registration & Online/Offline Events', `${pwaControllerJs}\n        // PWA Service Worker Registration & Online/Offline Events`);
}

// 6. Update DOMContentLoaded to trigger handlePwaShortcuts and showPwaInstallPrompts
if (!html.includes('handlePwaShortcuts();')) {
    html = html.replace('updateLocaSpecUI();', 'updateLocaSpecUI();\n            handlePwaShortcuts();\n            showPwaInstallPrompts(!!deferredInstallPrompt);');
}

// 7. Update Escape key dismissal for pwa-guide-modal
if (!html.includes('pwa-guide-modal')) {
    html = html.replace("const locaspecModal = document.getElementById('locaspec-modal');", `const pwaModal = document.getElementById('pwa-guide-modal');
                if (pwaModal && pwaModal.style.display === 'flex') {
                    closePwaGuideModal();
                    return;
                }
                const locaspecModal = document.getElementById('locaspec-modal');`);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully added Android PWA install and shortcuts feature into index.html');

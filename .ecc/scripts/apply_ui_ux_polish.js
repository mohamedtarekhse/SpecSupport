const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

// =========================================================================
// 1. MOBILE RESPONSIVENESS & DRAWER CSS
// =========================================================================
const mobileCssTarget = `        /* Mobile Ergonomics */
        @media (max-width: 768px) {
            .prompt-cards-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .gemini-hero-headline { font-size: 2.1rem; }
            .gemini-mode-switch .mode-pill { padding: 5px 9px; font-size: 0.75rem; }
            .header-actions { gap: 4px; }
            .icon-btn { width: 34px; height: 34px; }
            #chat-window { padding: 16px 14px 130px 14px; }
            #input-container { padding: 0 12px 14px 12px; }
        }
        @media (max-width: 480px) {
            .prompt-cards-grid {
                display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
                padding-bottom: 10px;
            }
            .prompt-card { min-width: 220px; scroll-snap-align: start; }
        }`;

const mobileCssReplacement = `        /* Mobile Ergonomics & Slide-Over Drawer */
        @media (max-width: 768px) {
            .prompt-cards-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .gemini-hero-headline { font-size: 1.85rem; }
            .gemini-mode-switch .mode-pill { padding: 4px 7px; font-size: 0.72rem; }
            .gemini-mode-switch .mode-pill span { display: none; }
            .gemini-mode-switch .mode-pill.active span { display: inline; }
            .header-actions { gap: 3px; }
            .icon-btn { width: 32px; height: 32px; padding: 6px; }

            /* NotebookLM Mobile Slide-Over Drawer */
            #notebooklm-sidebar {
                position: fixed !important;
                top: 57px;
                left: 0;
                bottom: 0;
                height: calc(100vh - 57px);
                z-index: 300;
                box-shadow: 6px 0 28px rgba(0,0,0,0.5);
            }
            body.rtl #notebooklm-sidebar {
                left: auto;
                right: 0;
                box-shadow: -6px 0 28px rgba(0,0,0,0.5);
            }
            #notebooklm-sidebar.collapsed {
                box-shadow: none !important;
            }
            #sidebar-backdrop {
                display: none;
                position: fixed;
                top: 57px;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.65);
                backdrop-filter: blur(3px);
                z-index: 290;
                transition: opacity 0.2s ease;
            }
            #sidebar-backdrop.active {
                display: block;
            }

            #chat-window { padding: 14px 10px 130px 10px; width: 100% !important; }
            #input-container { padding: 0 8px 12px 8px; width: 100% !important; }
            .gemini-modal-content { max-width: 96% !important; padding: 16px !important; }
        }
        @media (max-width: 480px) {
            header { padding: 8px 10px; }
            .logo-title span { display: none; }
            .header-actions .icon-btn:nth-child(2),
            .header-actions .icon-btn:nth-child(3) {
                display: none;
            }
            .prompt-cards-grid {
                display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
                padding-bottom: 10px;
            }
            .prompt-card { min-width: 220px; scroll-snap-align: start; }
        }`;

if (content.includes(norm(mobileCssTarget))) {
  content = content.replace(norm(mobileCssTarget), norm(mobileCssReplacement));
  console.log('✓ Mobile responsive CSS updated');
} else {
  console.error('✗ mobileCssTarget not found');
}

// =========================================================================
// 2. SIDEBAR BACKDROP ELEMENT IN HTML
// =========================================================================
const backdropTarget = `    <!-- NotebookLM Unified Layout Container -->
    <div id="main-layout-container" class="notebooklm-layout-container">
        <!-- NotebookLM Sources Sidebar -->`;

const backdropReplacement = `    <!-- NotebookLM Unified Layout Container -->
    <div id="main-layout-container" class="notebooklm-layout-container">
        <!-- Mobile Slide-Over Backdrop -->
        <div id="sidebar-backdrop" onclick="toggleSourcesSidebar()"></div>

        <!-- NotebookLM Sources Sidebar -->`;

if (content.includes(norm(backdropTarget))) {
  content = content.replace(norm(backdropTarget), norm(backdropReplacement));
  console.log('✓ Sidebar backdrop injected');
} else {
  console.error('✗ backdropTarget not found');
}

// =========================================================================
// 3. CURATOR SEARCH INPUT DEBOUNCE IN HTML
// =========================================================================
const curatorInputTarget = `<input type="text" id="curator-search-input" class="admin-input" style="width:100%; margin-bottom:0; padding-left:30px;" placeholder="Search clause, section, or content..." onkeydown="if(event.key==='Enter') loadCuratorChunks(1)">`;

const curatorInputReplacement = `<input type="text" id="curator-search-input" class="admin-input" style="width:100%; margin-bottom:0; padding-left:30px;" placeholder="Search clause, section, or content..." oninput="onCuratorSearchInput(this.value)" onkeydown="if(event.key==='Enter') loadCuratorChunks(1)">`;

if (content.includes(norm(curatorInputTarget))) {
  content = content.replace(norm(curatorInputTarget), norm(curatorInputReplacement));
  console.log('✓ Curator search debounce attribute added');
} else {
  console.error('✗ curatorInputTarget not found');
}

// =========================================================================
// 4. JAVASCRIPT POLISH: MOBILE TOGGLE, BACKDROP, ESCAPE KEY, PILLAR PERSISTENCE, COPY EXCERPT
// =========================================================================
const toggleFuncTarget = `        function toggleSourcesSidebar() {
            const sidebar = document.getElementById('notebooklm-sidebar');
            if (!sidebar) return;
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('inspecta_sidebar_collapsed', isCollapsed ? '1' : '0');
        }`;

const toggleFuncReplacement = `        function toggleSourcesSidebar() {
            const sidebar = document.getElementById('notebooklm-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (!sidebar) return;
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('inspecta_sidebar_collapsed', isCollapsed ? '1' : '0');

            if (backdrop) {
                if (!isCollapsed && window.innerWidth <= 768) {
                    backdrop.classList.add('active');
                } else {
                    backdrop.classList.remove('active');
                }
            }
        }`;

if (content.includes(norm(toggleFuncTarget))) {
  content = content.replace(norm(toggleFuncTarget), norm(toggleFuncReplacement));
  console.log('✓ toggleSourcesSidebar updated with mobile backdrop');
} else {
  console.error('✗ toggleFuncTarget not found');
}

// Update initNotebookLMSidebar for default mobile collapse & restore pillar state
const initSidebarTarget = `        async function initNotebookLMSidebar() {
            // Restore collapsed state
            if (localStorage.getItem('inspecta_sidebar_collapsed') === '1') {
                const sidebar = document.getElementById('notebooklm-sidebar');
                if (sidebar) sidebar.classList.add('collapsed');
            }`;

const initSidebarReplacement = `        async function initNotebookLMSidebar() {
            // Default to collapsed on mobile screens <= 768px, or if user explicitly collapsed it
            const shouldCollapse = (window.innerWidth <= 768 && localStorage.getItem('inspecta_sidebar_collapsed') !== '0') || localStorage.getItem('inspecta_sidebar_collapsed') === '1';
            const sidebar = document.getElementById('notebooklm-sidebar');
            if (sidebar && shouldCollapse) {
                sidebar.classList.add('collapsed');
            }`;

if (content.includes(norm(initSidebarTarget))) {
  content = content.replace(norm(initSidebarTarget), norm(initSidebarReplacement));
  console.log('✓ initNotebookLMSidebar updated for mobile default collapse');
} else {
  console.error('✗ initSidebarTarget not found');
}

// Update renderNotebookLMSidebar to persist collapsed pillars & show chunk sum in badge
const renderPillarTarget = `                html += \`
                    <div class="pillar-section" id="pillar-\${pillar.id}">
                        <div class="pillar-header" onclick="togglePillarSection('\${pillar.id}')">`;

const renderPillarReplacement = `                const isPillarCollapsed = collapsedPillarsSet.has(pillar.id);
                html += \`
                    <div class="pillar-section \${isPillarCollapsed ? 'collapsed' : ''}" id="pillar-\${pillar.id}">
                        <div class="pillar-header" onclick="togglePillarSection('\${pillar.id}')">`;

if (content.includes(norm(renderPillarTarget))) {
  content = content.replace(norm(renderPillarTarget), norm(renderPillarReplacement));
  console.log('✓ Pillar collapsed state rendering updated');
} else {
  console.error('✗ renderPillarTarget not found');
}

// Update togglePillarSection
const togglePillarTarget = `        function togglePillarSection(pillarId) {
            const el = document.getElementById(\`pillar-\${pillarId}\`);
            if (el) el.classList.toggle('collapsed');
        }`;

const togglePillarReplacement = `        function togglePillarSection(pillarId) {
            const el = document.getElementById(\`pillar-\${pillarId}\`);
            if (!el) return;
            el.classList.toggle('collapsed');
            if (el.classList.contains('collapsed')) {
                collapsedPillarsSet.add(pillarId);
            } else {
                collapsedPillarsSet.delete(pillarId);
            }
            localStorage.setItem('inspecta_collapsed_pillars', JSON.stringify(Array.from(collapsedPillarsSet)));
        }`;

if (content.includes(norm(togglePillarTarget))) {
  content = content.replace(norm(togglePillarTarget), norm(togglePillarReplacement));
  console.log('✓ togglePillarSection updated with localStorage persistence');
} else {
  console.error('✗ togglePillarTarget not found');
}

// Update updateSidebarCounts to show total chunks in scope badge
const updateCountsTarget = `        function updateSidebarCounts() {
            let totalAvailable = 0;
            let totalActive = 0;
            DRILLING_PILLARS.forEach(pillar => {
                const el = document.getElementById(\`pillar-\${pillar.id}\`);
                const active = pillar.standards.filter(s => selectedStandardsSet.has(s.code)).length;
                totalAvailable += pillar.standards.length;
                totalActive += active;
                if (el) {
                    const cntEl = el.querySelector('.pillar-badge-count');
                    if (cntEl) cntEl.textContent = \`\${active}/\${pillar.standards.length}\`;
                }
            });
            const badge = document.getElementById('active-scope-badge');
            if (badge) {
                badge.textContent = \`\${totalActive} of \${totalAvailable} Active\`;
            }
        }`;

const updateCountsReplacement = `        function updateSidebarCounts() {
            let totalAvailable = 0;
            let totalActive = 0;
            let activeChunksCount = 0;

            DRILLING_PILLARS.forEach(pillar => {
                const el = document.getElementById(\`pillar-\${pillar.id}\`);
                const active = pillar.standards.filter(s => selectedStandardsSet.has(s.code)).length;
                totalAvailable += pillar.standards.length;
                totalActive += active;
                if (el) {
                    const cntEl = el.querySelector('.pillar-badge-count');
                    if (cntEl) cntEl.textContent = \`\${active}/\${pillar.standards.length}\`;
                }
            });

            loadedCatalogStandards.forEach(s => {
                if (selectedStandardsSet.has(s.standard_code)) {
                    activeChunksCount += (s.chunk_count || 0);
                }
            });

            const badge = document.getElementById('active-scope-badge');
            if (badge) {
                if (activeChunksCount > 0) {
                    badge.textContent = \`\${totalActive}/\${totalAvailable} Active (\${activeChunksCount.toLocaleString()} Chunks)\`;
                } else {
                    badge.textContent = \`\${totalActive} of \${totalAvailable} Active\`;
                }
            }
        }`;

if (content.includes(norm(updateCountsTarget))) {
  content = content.replace(norm(updateCountsTarget), norm(updateCountsReplacement));
  console.log('✓ updateSidebarCounts updated with chunk volume');
} else {
  console.error('✗ updateCountsTarget not found');
}

// Add Copy Excerpt button to curator table row actions
const rowActionsTarget = `<button class="curator-action-btn" title="Edit & Re-Embed" onclick="openCuratorEditModal(\${chunk.id})">✏️</button>
                                <button class="curator-action-btn" title="\${isExcluded ? 'Include Chunk' : 'Exclude Chunk'}" onclick="toggleChunkExclude(\${chunk.id})">\${isExcluded ? '👁️' : '🚫'}</button>
                                <button class="curator-action-btn danger" title="Delete Chunk" onclick="deleteChunk(\${chunk.id})">🗑️</button>`;

const rowActionsReplacement = `<button class="curator-action-btn" title="Copy Clause Excerpt" onclick="copyCuratorExcerpt(event, \${chunk.id})">📋</button>
                                <button class="curator-action-btn" title="Edit & Re-Embed" onclick="openCuratorEditModal(\${chunk.id})">✏️</button>
                                <button class="curator-action-btn" title="\${isExcluded ? 'Include Chunk' : 'Exclude Chunk'}" onclick="toggleChunkExclude(\${chunk.id})">\${isExcluded ? '👁️' : '🚫'}</button>
                                <button class="curator-action-btn danger" title="Delete Chunk" onclick="deleteChunk(\${chunk.id})">🗑️</button>`;

if (content.includes(norm(rowActionsTarget))) {
  content = content.replace(norm(rowActionsTarget), norm(rowActionsReplacement));
  console.log('✓ Copy Excerpt button added to curator table');
} else {
  console.error('✗ rowActionsTarget not found');
}

// Add global keyboard ESC listener, backdrop dismiss, search debounce, and copy excerpt helpers
const additionalHelpers = `
        // Global Debounce Handler for Curator Search
        let curatorSearchDebounceTimer = null;
        function onCuratorSearchInput(val) {
            clearTimeout(curatorSearchDebounceTimer);
            curatorSearchDebounceTimer = setTimeout(() => {
                loadCuratorChunks(1);
            }, 300);
        }

        // 1-Click Copy Excerpt Helper with Visual Feedback
        function copyCuratorExcerpt(event, id) {
            event.stopPropagation();
            const chunk = curatorChunksMap[id];
            if (!chunk || !chunk.content) return;
            navigator.clipboard.writeText(chunk.content).then(() => {
                const btn = event.currentTarget;
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '✓';
                btn.style.color = '#10B981';
                btn.style.borderColor = '#10B981';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 1500);
            }).catch(err => {
                console.warn("Clipboard copy error:", err);
            });
        }

        // Global Keyboard Dismissal (Escape Key) & Backdrop Click Handler
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const editModal = document.getElementById('curator-edit-modal');
                if (editModal && editModal.style.display === 'flex') {
                    closeCuratorEditModal();
                    return;
                }
                const curatorModal = document.getElementById('knowledge-curator-modal');
                if (curatorModal && curatorModal.style.display === 'flex') {
                    closeKnowledgeCurator();
                    return;
                }
                const visionModal = document.getElementById('vision-modal');
                if (visionModal && visionModal.style.display === 'flex') {
                    closeVisionModal();
                    return;
                }
                const auditModal = document.getElementById('verification-audit-modal');
                if (auditModal && auditModal.style.display === 'flex') {
                    document.getElementById('verification-audit-modal').style.display = 'none';
                    return;
                }
                const stdModal = document.getElementById('standards-modal');
                if (stdModal && stdModal.style.display === 'flex') {
                    closeStandardsModal();
                    return;
                }
                const adminPanel = document.getElementById('admin-panel');
                if (adminPanel && adminPanel.style.display === 'block') {
                    adminPanel.style.display = 'none';
                    return;
                }
                const sidebar = document.getElementById('notebooklm-sidebar');
                if (sidebar && !sidebar.classList.contains('collapsed') && window.innerWidth <= 768) {
                    toggleSourcesSidebar();
                }
            }
        });

        // Click on Blurred Backdrop to Dismiss Modals
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('gemini-modal')) {
                e.target.style.display = 'none';
                const backdrop = document.getElementById('sidebar-backdrop');
                if (backdrop && window.innerWidth <= 768) backdrop.classList.remove('active');
            }
        });
`;

// Also add collapsedPillarsSet state definition near DRILLING_PILLARS
const stateDefinitionTarget = `        let loadedCatalogStandards = [];
        let selectedStandardsSet = new Set();
        let totalDatabaseChunks = 0;`;

const stateDefinitionReplacement = `        let loadedCatalogStandards = [];
        let selectedStandardsSet = new Set();
        let totalDatabaseChunks = 0;
        let collapsedPillarsSet = new Set();
        try {
            const savedCollapsed = localStorage.getItem('inspecta_collapsed_pillars');
            if (savedCollapsed) collapsedPillarsSet = new Set(JSON.parse(savedCollapsed));
        } catch(e){}`;

if (content.includes(norm(stateDefinitionTarget))) {
  content = content.replace(norm(stateDefinitionTarget), norm(stateDefinitionReplacement));
  console.log('✓ collapsedPillarsSet state initialized');
} else {
  console.error('✗ stateDefinitionTarget not found');
}

// Inject additional helpers right before DOMContentLoaded
const domTarget = `        // Auto-load token from storage on startup
        window.addEventListener('DOMContentLoaded', () => {`;

if (content.includes(norm(domTarget))) {
  content = content.replace(norm(domTarget), `${additionalHelpers}\n${domTarget}`);
  console.log('✓ Additional UI/UX helper functions injected');
} else {
  console.error('✗ domTarget not found');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('index.html UI/UX polish successfully applied!');

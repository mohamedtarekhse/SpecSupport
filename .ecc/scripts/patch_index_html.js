const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(targetFile, 'utf8');

// Helper to normalize CRLF
const norm = (s) => s.replace(/\r\n/g, '\n');
content = norm(content);

// =========================================================================
// 1. CSS INJECTION (Before </style>)
// =========================================================================
const cssInjection = `
        /* ========================================== */
        /* NOTEBOOKLM LEFT SOURCES & CURATION STYLES  */
        /* ========================================== */
        .notebooklm-layout-container {
            display: flex;
            flex-direction: row;
            width: 100%;
            height: calc(100vh - 58px);
            overflow: hidden;
            position: relative;
        }

        #notebooklm-sidebar {
            width: 320px;
            min-width: 320px;
            max-width: 320px;
            background: var(--gemini-surface);
            border-right: 1px solid var(--gemini-border);
            display: flex;
            flex-direction: column;
            height: 100%;
            z-index: 50;
            transition: width 0.22s cubic-bezier(0.2, 0, 0, 1), min-width 0.22s, transform 0.22s, opacity 0.2s;
            user-select: none;
            position: relative;
        }

        #notebooklm-sidebar.collapsed {
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
            border-right: none;
        }

        body.rtl #notebooklm-sidebar {
            border-right: none;
            border-left: 1px solid var(--gemini-border);
        }

        body.rtl #notebooklm-sidebar.collapsed {
            transform: translateX(100%);
        }

        .sidebar-header {
            padding: 12px 14px 10px 14px;
            border-bottom: 1px solid var(--gemini-border);
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: var(--gemini-surface);
            flex-shrink: 0;
        }

        .sidebar-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sidebar-title {
            font-size: 0.92rem;
            font-weight: 700;
            letter-spacing: -0.2px;
            display: flex;
            align-items: center;
            gap: 7px;
            color: var(--gemini-text-main);
        }

        .sidebar-search-box {
            position: relative;
            width: 100%;
        }

        .sidebar-search-box input {
            width: 100%;
            padding: 6px 10px 6px 28px;
            border-radius: 8px;
            border: 1px solid var(--gemini-border);
            background: var(--gemini-bg);
            color: var(--gemini-text-main);
            font-size: 0.8rem;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.15s;
        }

        .sidebar-search-box input:focus {
            border-color: var(--sap-blue);
        }

        .sidebar-search-box svg {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 13px;
            height: 13px;
            color: var(--gemini-text-muted);
            pointer-events: none;
        }

        body.rtl .sidebar-search-box input {
            padding: 6px 28px 6px 10px;
        }

        body.rtl .sidebar-search-box svg {
            left: auto;
            right: 8px;
        }

        .sidebar-controls-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.76rem;
            margin-top: 2px;
        }

        .sidebar-btn-link {
            background: none;
            border: none;
            color: var(--sap-blue);
            font-size: 0.74rem;
            cursor: pointer;
            font-weight: 600;
            padding: 2px 4px;
            border-radius: 4px;
            text-decoration: none;
        }

        .sidebar-btn-link:hover {
            background: var(--gemini-surface-hover);
        }

        .scope-count-badge {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-border);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            color: var(--gemini-text-muted);
            font-weight: 600;
        }

        .sidebar-scroll-area {
            flex: 1;
            overflow-y: auto;
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .pillar-section {
            border: 1px solid var(--gemini-border);
            border-radius: 10px;
            background: var(--gemini-bg);
            overflow: hidden;
            transition: border-color 0.15s ease;
        }

        .pillar-section:hover {
            border-color: var(--sap-blue-soft-border);
        }

        .pillar-header {
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            background: var(--gemini-surface);
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--gemini-text-main);
            transition: background 0.15s ease;
            user-select: none;
        }

        .pillar-header:hover {
            background: var(--gemini-surface-hover);
        }

        .pillar-header-left {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .pillar-badge-count {
            font-size: 0.68rem;
            padding: 1px 6px;
            border-radius: 8px;
            background: var(--gemini-border);
            color: var(--gemini-text-muted);
            font-weight: 600;
        }

        .pillar-chevron {
            width: 14px;
            height: 14px;
            transition: transform 0.2s ease;
            color: var(--gemini-text-muted);
            stroke-width: 2.2;
        }

        .pillar-section.collapsed .pillar-chevron {
            transform: rotate(-90deg);
        }

        body.rtl .pillar-section.collapsed .pillar-chevron {
            transform: rotate(90deg);
        }

        .pillar-section.collapsed .pillar-content {
            display: none;
        }

        .pillar-content {
            padding: 4px 6px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .std-item-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 7px;
            border-radius: 7px;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .std-item-row:hover {
            background: var(--gemini-surface-hover);
        }

        .std-checkbox {
            width: 14px;
            height: 14px;
            accent-color: var(--sap-blue);
            cursor: pointer;
            flex-shrink: 0;
            margin: 0;
        }

        .std-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .std-code-title {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--gemini-text-main);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .std-desc-sub {
            font-size: 0.68rem;
            color: var(--gemini-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .std-chunk-count {
            font-size: 0.68rem;
            padding: 1px 5px;
            border-radius: 5px;
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-border);
            color: var(--gemini-text-muted);
            white-space: nowrap;
            flex-shrink: 0;
        }

        .sidebar-footer {
            padding: 10px 12px;
            border-top: 1px solid var(--gemini-border);
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: var(--gemini-surface);
            flex-shrink: 0;
        }

        .sidebar-action-btn {
            width: 100%;
            padding: 7px 10px;
            border-radius: 8px;
            border: 1px solid var(--gemini-border);
            background: var(--gemini-bg);
            color: var(--gemini-text-main);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .sidebar-action-btn:hover {
            background: var(--gemini-surface-hover);
            border-color: var(--sap-blue);
            color: var(--sap-blue);
        }

        .sidebar-action-btn.primary {
            background: var(--sap-blue);
            color: #fff;
            border-color: var(--sap-blue);
        }

        .sidebar-action-btn.primary:hover {
            background: var(--sap-blue-hover);
        }

        /* Knowledge Base Curation Portal Custom Table & Tags */
        .curator-badge-active {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 6px;
            background: rgba(16, 185, 129, 0.12);
            color: #10B981;
            font-weight: 600;
            font-size: 0.72rem;
            border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .curator-badge-excluded {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 6px;
            background: rgba(239, 68, 68, 0.12);
            color: #EF4444;
            font-weight: 600;
            font-size: 0.72rem;
            border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .curator-action-btn {
            background: transparent;
            border: 1px solid var(--gemini-border);
            border-radius: 6px;
            padding: 3px 6px;
            cursor: pointer;
            color: var(--gemini-text-muted);
            transition: all 0.15s;
            font-size: 0.75rem;
        }

        .curator-action-btn:hover {
            background: var(--gemini-surface-hover);
            color: var(--gemini-text-main);
            border-color: var(--sap-blue);
        }

        .curator-action-btn.danger:hover {
            border-color: #EF4444;
            color: #EF4444;
        }
`;

if (!content.includes('NOTEBOOKLM LEFT SOURCES & CURATION STYLES')) {
  content = content.replace('    </style>', `${cssInjection}\n    </style>`);
  console.log('✓ CSS injected');
} else {
  console.log('• CSS already present');
}

// =========================================================================
// 2. HEADER TOGGLE BUTTON INJECTION
// =========================================================================
const headerToggleBtn = `<button class="icon-btn" id="sidebar-toggle-btn" title="Toggle Sources & Standards Panel" onclick="toggleSourcesSidebar()" style="margin-right: 4px;">
                <svg class="gemini-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>`;

if (!content.includes('id="sidebar-toggle-btn"')) {
  content = content.replace('<div class="header-left">\n            <a href="#" class="logo-title"', `<div class="header-left">\n            ${headerToggleBtn}\n            <a href="#" class="logo-title"`);
  console.log('✓ Header toggle button injected');
} else {
  console.log('• Header toggle button already present');
}

// =========================================================================
// 3. NOTEBOOKLM SIDEBAR MARKUP & WRAPPER INJECTION
// =========================================================================
const sidebarMarkup = `    <!-- NotebookLM Unified Layout Container -->
    <div id="main-layout-container" class="notebooklm-layout-container">
        <!-- NotebookLM Sources Sidebar -->
        <aside id="notebooklm-sidebar" class="sources-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title-row">
                    <div class="sidebar-title">
                        <svg class="gemini-svg" style="width:16px; height:16px; stroke:var(--sap-blue);" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM8 7h8M8 11h6"/></svg>
                        <span>Sources & Specs</span>
                    </div>
                    <button class="icon-btn" onclick="toggleSourcesSidebar()" title="Collapse Panel" style="padding:2px 4px; height:24px; width:24px;">
                        <svg class="gemini-svg" style="width:14px; height:14px;" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                </div>
                <div class="sidebar-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="source-search-input" placeholder="Filter standards & manuals..." oninput="filterSidebarStandards(this.value)">
                </div>
                <div class="sidebar-controls-row">
                    <div style="display:flex; gap:6px;">
                        <button class="sidebar-btn-link" onclick="selectAllStandards(true)">Select All</button>
                        <span style="color:var(--gemini-border);">|</span>
                        <button class="sidebar-btn-link" onclick="selectAllStandards(false)">Clear</button>
                    </div>
                    <span id="active-scope-badge" class="scope-count-badge">Calculating...</span>
                </div>
            </div>

            <!-- 4 Pillar Categorized Standards Container -->
            <div class="sidebar-scroll-area" id="sidebar-pillars-container">
                <!-- Dynamically populated by renderNotebookLMSidebar() -->
            </div>

            <!-- Sidebar Action Footer -->
            <div class="sidebar-footer">
                <button class="sidebar-action-btn primary" onclick="openStandardsModal()">
                    <svg class="gemini-svg" style="width:14px; height:14px;" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Ingest Standard / Manual</span>
                </button>
                <button class="sidebar-action-btn" onclick="openKnowledgeCurator()">
                    <svg class="gemini-svg" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span>Curate Database Chunks</span>
                </button>
            </div>
        </aside>

        <!-- Main Workspace Area -->`;

if (!content.includes('id="main-layout-container"')) {
  content = content.replace('    <!-- Main Workspace Area -->\n    <div id="app-container" class="state-greeting">', `${sidebarMarkup}\n        <div id="app-container" class="state-greeting">`);
  
  // Close main-layout-container after app-container
  const appContainerEnd = `            <div class="gemini-disclaimer">
                Inspecta can make mistakes. Always verify critical acceptance criteria with your project quality plan.
            </div>
        </div>

    </div>`;

  const appContainerEndReplacement = `            <div class="gemini-disclaimer">
                Inspecta can make mistakes. Always verify critical acceptance criteria with your project quality plan.
            </div>
        </div>

    </div>
    </div> <!-- /#main-layout-container -->`;

  content = content.replace(appContainerEnd, appContainerEndReplacement);
  console.log('✓ Main layout wrapper & sidebar markup injected');
} else {
  console.log('• Main layout container already present');
}

// =========================================================================
// 4. KNOWLEDGE CURATION MODAL INJECTION
// =========================================================================
const curatorModalMarkup = `
    <!-- Knowledge Base Curation & Database Refiner Modal -->
    <div id="knowledge-curator-modal" class="gemini-modal" style="display:none; z-index:1100;">
        <div class="gemini-modal-content" style="max-width:1150px; width:95%; height:90vh; display:flex; flex-direction:column; padding:20px; box-sizing:border-box;">
            <!-- Modal Header -->
            <div class="modal-header" style="padding-bottom:12px; margin-bottom:12px; flex-shrink:0;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:8px; background:var(--sap-blue-soft); display:flex; align-items:center; justify-content:center; color:var(--sap-blue);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem; font-weight:700;">Knowledge Base Curation & Database Refiner</h3>
                        <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--gemini-text-muted);">Search, inspect, edit, re-embed, toggle exclusions, and delete vector chunks</p>
                    </div>
                </div>
                <button class="close-modal-btn" onclick="closeKnowledgeCurator()">&times;</button>
            </div>

            <!-- Filters & Actions Toolbar -->
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px; flex-shrink:0;">
                <select id="curator-std-select" class="admin-input" style="width:200px; margin-bottom:0;" onchange="loadCuratorChunks(1)">
                    <option value="">All Standards</option>
                </select>
                <div style="position:relative; flex:1; min-width:220px;">
                    <input type="text" id="curator-search-input" class="admin-input" style="width:100%; margin-bottom:0; padding-left:30px;" placeholder="Search clause, section, or content..." onkeydown="if(event.key==='Enter') loadCuratorChunks(1)">
                    <svg style="position:absolute; left:9px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:var(--gemini-text-muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <select id="curator-status-select" class="admin-input" style="width:130px; margin-bottom:0;" onchange="loadCuratorChunks(1)">
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="excluded">Excluded Only</option>
                </select>
                <button class="mode-pill active" onclick="loadCuratorChunks(1)" style="height:36px; padding:0 14px;">Search</button>
                <button class="mode-pill" onclick="purgeCurrentStandard()" id="curator-purge-std-btn" style="height:36px; padding:0 12px; border-color:#EF4444; color:#EF4444; display:none;" title="Purge entire standard and all its chunks/tables">Purge Standard</button>
            </div>

            <!-- Bulk Action Bar -->
            <div id="curator-bulk-bar" style="display:none; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--sap-blue-soft); border:1px solid var(--sap-blue-soft-border); border-radius:8px; margin-bottom:10px; flex-shrink:0;">
                <span id="curator-selected-count" style="font-size:0.8rem; font-weight:600; color:var(--sap-blue);">0 chunks selected</span>
                <div style="display:flex; gap:8px;">
                    <button class="mode-pill" onclick="bulkToggleExclude(true)" style="font-size:0.75rem; padding:4px 10px;">Exclude Selected</button>
                    <button class="mode-pill" onclick="bulkToggleExclude(false)" style="font-size:0.75rem; padding:4px 10px;">Include Selected</button>
                    <button class="mode-pill" onclick="bulkDeleteChunks()" style="font-size:0.75rem; padding:4px 10px; border-color:#EF4444; color:#EF4444;">Bulk Delete</button>
                </div>
            </div>

            <!-- Data Table Container -->
            <div style="flex:1; overflow-y:auto; border:1px solid var(--gemini-border); border-radius:8px; background:var(--gemini-bg);">
                <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                    <thead style="position:sticky; top:0; background:var(--gemini-surface); border-bottom:1px solid var(--gemini-border); z-index:10;">
                        <tr>
                            <th style="width:36px; text-align:center; padding:8px;"><input type="checkbox" id="curator-select-all-page" onchange="toggleSelectAllPage(this.checked)"></th>
                            <th style="width:60px; text-align:left; padding:8px;">ID</th>
                            <th style="width:120px; text-align:left; padding:8px;">Standard</th>
                            <th style="width:110px; text-align:left; padding:8px;">Clause</th>
                            <th style="width:130px; text-align:left; padding:8px;">Section</th>
                            <th style="text-align:left; padding:8px;">Content Excerpt</th>
                            <th style="width:85px; text-align:center; padding:8px;">Status</th>
                            <th style="width:130px; text-align:center; padding:8px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="curator-table-body">
                        <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--gemini-text-muted);">Loading database chunks...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination Footer -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; margin-top:8px; border-top:1px solid var(--gemini-border); flex-shrink:0;">
                <div id="curator-pagination-info" style="font-size:0.78rem; color:var(--gemini-text-muted);">Showing 0-0 of 0 chunks</div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button id="curator-prev-btn" class="sidebar-btn-link" onclick="prevCuratorPage()" disabled>&larr; Previous</button>
                    <span id="curator-page-indicator" style="font-size:0.78rem; font-weight:600; padding:0 6px;">Page 1</span>
                    <button id="curator-next-btn" class="sidebar-btn-link" onclick="nextCuratorPage()" disabled>Next &rarr;</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Chunk Edit Modal -->
    <div id="curator-edit-modal" class="gemini-modal" style="display:none; z-index:1200;">
        <div class="gemini-modal-content" style="max-width:680px; width:90%; padding:22px; box-sizing:border-box;">
            <div class="modal-header">
                <h3 style="margin:0; font-size:1.05rem;">Edit Chunk & Recalculate Vector Embedding</h3>
                <button class="close-modal-btn" onclick="closeCuratorEditModal()">&times;</button>
            </div>
            <div style="font-size:0.75rem; color:#10B981; margin-bottom:12px; background:rgba(16,185,129,0.08); padding:8px 12px; border-radius:6px; border:1px solid rgba(16,185,129,0.2);">
                ⚡ Saving will automatically re-embed this chunk with 768-D vectors via Cloudflare BAAI bge-small-en-v1.5 and update D1.
            </div>
            <input type="hidden" id="edit-chunk-id">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div>
                    <label style="font-size:0.75rem; color:var(--gemini-text-muted); display:block; margin-bottom:4px;">Standard Code</label>
                    <input type="text" id="edit-chunk-std" class="admin-input" style="margin-bottom:0;">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:var(--gemini-text-muted); display:block; margin-bottom:4px;">Clause</label>
                    <input type="text" id="edit-chunk-clause" class="admin-input" style="margin-bottom:0;">
                </div>
            </div>
            <div style="margin-bottom:10px;">
                <label style="font-size:0.75rem; color:var(--gemini-text-muted); display:block; margin-bottom:4px;">Section Context</label>
                <input type="text" id="edit-chunk-section" class="admin-input" style="margin-bottom:0;">
            </div>
            <div style="margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Chunk Content</label>
                    <span id="edit-chunk-char-count" style="font-size:0.72rem; color:var(--gemini-text-muted);">0 chars</span>
                </div>
                <textarea id="edit-chunk-content" class="admin-input" style="height:180px; resize:vertical; font-family:monospace; font-size:0.82rem; margin-bottom:0;" oninput="document.getElementById('edit-chunk-char-count').textContent = this.value.length + ' chars'"></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="mode-pill" onclick="closeCuratorEditModal()">Cancel</button>
                <button class="sidebar-action-btn primary" id="edit-chunk-save-btn" onclick="saveCuratorChunk()" style="width:auto; padding:0 20px;">Save & Re-Embed</button>
            </div>
        </div>
    </div>
`;

if (!content.includes('id="knowledge-curator-modal"')) {
  content = content.replace('    <!-- Standards Verification & Accuracy Audit Modal -->', `${curatorModalMarkup}\n    <!-- Standards Verification & Accuracy Audit Modal -->`);
  console.log('✓ Curation & edit modals injected');
} else {
  console.log('• Curation modal already present');
}

// =========================================================================
// 5. UPDATE SENDMESSAGE TO PASS SELECTED_STANDARDS
// =========================================================================
const sendMessageTarget = `                    body: JSON.stringify({
                        question: text,
                        language: isArabic ? 'ar' : 'en',
                        session_id: sessionId,
                        standard_filter: currentMode === 'web' ? '🌐 GENERAL AI' : 'ALL',
                        mode: currentMode,
                        history: chatHistory.slice(-4)
                    })`;

const sendMessageReplacement = `                    body: JSON.stringify({
                        question: text,
                        language: isArabic ? 'ar' : 'en',
                        session_id: sessionId,
                        standard_filter: currentMode === 'web' ? '🌐 GENERAL AI' : 'ALL',
                        mode: currentMode,
                        selected_standards: getActiveStandards(),
                        history: chatHistory.slice(-4)
                    })`;

if (content.includes(sendMessageTarget)) {
  content = content.replace(sendMessageTarget, sendMessageReplacement);
  console.log('✓ sendMessage updated with selected_standards');
} else {
  console.log('• sendMessage already has selected_standards or target altered');
}

// =========================================================================
// 6. JAVASCRIPT LOGIC FOR SIDEBAR & CURATION
// =========================================================================
const jsLogic = `
        // ==========================================
        // NOTEBOOKLM SOURCES SIDEBAR & 4-PILLAR LOGIC
        // ==========================================
        const DRILLING_PILLARS = [
            {
                id: 'operations',
                name: 'Operations & Well Control',
                icon: '<svg class="gemini-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
                description: 'Rig operations, well operations, casing running, well control & OEM procedures',
                standards: [
                    { code: 'API RP 4G', title: 'Drilling Mast & Derrick Operations, Inspection & Erection', desc: 'Category I-IV Rig Inspections', pattern: /4G/i },
                    { code: 'API RP 5C1', title: 'Care, Handling & Running of Casing & Tubing', desc: 'Running practice, torque, makeup', pattern: /5C1/i },
                    { code: 'IADC WellSharp', title: 'Well Control Operations & Kill Sheets', desc: 'Hard shut-in, KMW, choke ops', pattern: /IADC/i },
                    { code: 'OEM BOP', title: 'Cameron Type U & Hydril GK OEM Rig Operations', desc: 'Ram changes, bonnet seals, stripping', pattern: /OEM|Cameron|Hydril/i }
                ]
            },
            {
                id: 'maintenance',
                name: 'Maintenance & Inspection',
                icon: '<svg class="gemini-svg" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                description: 'In-service wear, Cat I-IV overhauls, NDT schedules & retirement limits',
                standards: [
                    { code: 'API RP 8B', title: 'Hoisting Tool Inspection & Discard (ISO 13534)', desc: 'Elevators, links, blocks, hooks', pattern: /8B|13534/i },
                    { code: 'API RP 7G-2', title: 'Drill Stem Elements & Tool Joints', desc: 'Premium, Class 2, wear & washouts', pattern: /7G-2/i },
                    { code: 'ASME V Article 2', title: 'Radiographic Examination (RT)', desc: 'Density limits 1.8-4.0, IQI sensitivity', pattern: /ASME\\s*V.*RT|Article\\s*2/i },
                    { code: 'ASME V Article 4', title: 'Ultrasonic Examination (UT)', desc: 'DAC curves, angle beam, calibration', pattern: /ASME\\s*V.*UT|Article\\s*4/i },
                    { code: 'API RP 2X', title: 'Offshore Structural NDT Examination', desc: 'Node weld UT, WFMT, defect sizing', pattern: /2X/i },
                    { code: 'AWS B1.11', title: 'Visual Examination of Welds (VT)', desc: 'Profile, undercut, fillet throat gauges', pattern: /B1\\.11/i },
                    { code: 'API 510', title: 'Pressure Vessel In-Service Inspection', desc: 'Rerating, corrosion rate, MAWP', pattern: /510/i },
                    { code: 'API 570', title: 'Piping In-Service Inspection', desc: 'CML thickness monitoring, repairs', pattern: /570/i }
                ]
            },
            {
                id: 'asset_qa',
                name: 'Asset & Quality Assurance',
                icon: '<svg class="gemini-svg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                description: 'Manufacturing specs, PSL proof tests, welding qualification, construction codes',
                standards: [
                    { code: 'API Spec 4F', title: 'Drilling & Well Servicing Structures Spec', desc: 'Design, PSL proof load, mast straightness', pattern: /4F/i },
                    { code: 'API Spec 8C', title: 'Hoisting Equipment Manufacturing Spec', desc: 'PSL 1 & 2 design verification & proof tests', pattern: /8C/i },
                    { code: 'API 5CT', title: 'Casing & Tubing Manufacturing Spec', desc: 'Grades L-80, C-90, P-110, hardness limits', pattern: /5CT/i },
                    { code: 'ISO 3834-2', title: 'Fusion Welding Quality Requirements', desc: 'WPS, PQR, IWE/IWT coordinator authority', pattern: /3834/i },
                    { code: 'AWS D1.1', title: 'Structural Welding Code - Steel', desc: 'Cyclic welds, visual & NDT criteria', pattern: /D1\\.1/i },
                    { code: 'ASME VIII', title: 'Pressure Vessels Sec VIII Div 1', desc: 'UG-27 shell thickness, UW-12 efficiency', pattern: /VIII/i },
                    { code: 'ASME B31.3', title: 'Process Piping Code', desc: 'Table 341.3.2, severe cyclic conditions', pattern: /B31\\.3/i },
                    { code: 'ASME B31.4', title: 'Liquid Transportation Pipelines', desc: 'Hydrostatic test 1.25x MAOP, leak criteria', pattern: /B31\\.4/i },
                    { code: 'ASME B31.8', title: 'Gas Transmission & Distribution Piping', desc: 'Class location factors, test pressures', pattern: /B31\\.8/i },
                    { code: 'API 1104', title: 'Welding of Pipelines & Related Facilities', desc: 'Cross-country welds, Section 9 acceptance', pattern: /1104/i }
                ]
            },
            {
                id: 'safety',
                name: 'Safety & Well Control',
                icon: '<svg class="gemini-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                description: 'Kick containment, BOP accumulator sizing, H2S sour service compliance',
                standards: [
                    { code: 'API Std 53', title: 'Blowout Prevention Equipment Systems (API RP 53)', desc: 'Choke manifold, accumulator, testing', pattern: /53/i },
                    { code: 'API Spec 16D', title: 'Control Systems for Drilling Well Control', desc: 'Response time, reservoir volume', pattern: /16D/i },
                    { code: 'DS-1', title: 'Drill Stem Design & Failure Prevention', desc: 'Cat 3-5 critical fatigue and sour service', pattern: /DS-1|ds1/i }
                ]
            }
        ];

        let loadedCatalogStandards = [];
        let selectedStandardsSet = new Set();
        let totalDatabaseChunks = 0;

        function toggleSourcesSidebar() {
            const sidebar = document.getElementById('notebooklm-sidebar');
            if (!sidebar) return;
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('inspecta_sidebar_collapsed', isCollapsed ? '1' : '0');
        }

        async function initNotebookLMSidebar() {
            // Restore collapsed state
            if (localStorage.getItem('inspecta_sidebar_collapsed') === '1') {
                const sidebar = document.getElementById('notebooklm-sidebar');
                if (sidebar) sidebar.classList.add('collapsed');
            }

            try {
                const res = await fetch(\`\${API_BASE}/api/admin/catalog\`);
                const data = await res.json();
                loadedCatalogStandards = data.standards || [];
                totalDatabaseChunks = data.total_chunks || 0;
            } catch(e) {
                console.warn("Could not fetch remote catalog for sidebar, using predefined:", e);
            }

            // Restore selected standards from localStorage
            const savedSelected = localStorage.getItem('inspecta_selected_standards');
            if (savedSelected) {
                try {
                    const arr = JSON.parse(savedSelected);
                    selectedStandardsSet = new Set(arr);
                } catch(e) {
                    selectedStandardsSet = new Set();
                }
            } else {
                // Default: all standards active
                selectedStandardsSet = new Set();
                DRILLING_PILLARS.forEach(p => p.standards.forEach(s => selectedStandardsSet.add(s.code)));
                loadedCatalogStandards.forEach(s => selectedStandardsSet.add(s.standard_code));
            }

            renderNotebookLMSidebar();
            populateCuratorStandardsFilter();
        }

        function renderNotebookLMSidebar(searchFilter = '') {
            const container = document.getElementById('sidebar-pillars-container');
            if (!container) return;

            const qLower = searchFilter.trim().toLowerCase();
            let totalAvailable = 0;
            let totalActive = 0;

            let html = '';

            DRILLING_PILLARS.forEach(pillar => {
                const filteredStds = pillar.standards.filter(s => {
                    if (!qLower) return true;
                    return s.code.toLowerCase().includes(qLower) || s.title.toLowerCase().includes(qLower) || s.desc.toLowerCase().includes(qLower);
                });

                if (filteredStds.length === 0 && qLower) return;

                const activeInPillar = filteredStds.filter(s => selectedStandardsSet.has(s.code)).length;
                totalAvailable += filteredStds.length;
                totalActive += activeInPillar;

                html += \`
                    <div class="pillar-section" id="pillar-\${pillar.id}">
                        <div class="pillar-header" onclick="togglePillarSection('\${pillar.id}')">
                            <div class="pillar-header-left">
                                \${pillar.icon}
                                <span>\${pillar.name}</span>
                                <span class="pillar-badge-count">\${activeInPillar}/\${filteredStds.length}</span>
                            </div>
                            <svg class="pillar-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <div class="pillar-content">
                \`;

                filteredStds.forEach(std => {
                    const isChecked = selectedStandardsSet.has(std.code);
                    // Match chunk count from loaded catalog if available
                    const catMatch = loadedCatalogStandards.find(c => c.standard_code.toUpperCase().includes(std.code.toUpperCase()) || (std.pattern && std.pattern.test(c.standard_code)));
                    const chunkCount = catMatch ? catMatch.chunk_count : 'Code';

                    html += \`
                        <div class="std-item-row" onclick="toggleStandardCheckbox(event, '\${std.code}')">
                            <input type="checkbox" class="std-checkbox" data-std="\${std.code}" \${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); onStandardCheckboxChanged('\${std.code}', this.checked)">
                            <div class="std-info">
                                <div class="std-code-title" title="\${std.title}">\${std.code}</div>
                                <div class="std-desc-sub" title="\${std.desc}">\${std.desc}</div>
                            </div>
                            <span class="std-chunk-count">\${chunkCount}</span>
                        </div>
                    \`;
                });

                html += \`
                        </div>
                    </div>
                \`;
            });

            // Dynamically add any catalog standards not matched in the 4 pillars
            const uncategorized = loadedCatalogStandards.filter(cat => {
                return !DRILLING_PILLARS.some(p => p.standards.some(s => s.pattern && s.pattern.test(cat.standard_code)));
            });

            if (uncategorized.length > 0) {
                const filteredUncat = uncategorized.filter(u => {
                    if (!qLower) return true;
                    return u.standard_code.toLowerCase().includes(qLower);
                });

                if (filteredUncat.length > 0) {
                    const activeUncat = filteredUncat.filter(u => selectedStandardsSet.has(u.standard_code)).length;
                    totalAvailable += filteredUncat.length;
                    totalActive += activeUncat;

                    html += \`
                        <div class="pillar-section" id="pillar-custom">
                            <div class="pillar-header" onclick="togglePillarSection('custom')">
                                <div class="pillar-header-left">
                                    <svg class="gemini-svg" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                    <span>Custom Ingested Standards</span>
                                    <span class="pillar-badge-count">\${activeUncat}/\${filteredUncat.length}</span>
                                </div>
                                <svg class="pillar-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div class="pillar-content">
                    \`;

                    filteredUncat.forEach(std => {
                        const isChecked = selectedStandardsSet.has(std.standard_code);
                        html += \`
                            <div class="std-item-row" onclick="toggleStandardCheckbox(event, '\${std.standard_code}')">
                                <input type="checkbox" class="std-checkbox" data-std="\${std.standard_code}" \${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); onStandardCheckboxChanged('\${std.standard_code}', this.checked)">
                                <div class="std-info">
                                    <div class="std-code-title">\${std.standard_code}</div>
                                    <div class="std-desc-sub">Ingested Document</div>
                                </div>
                                <span class="std-chunk-count">\${std.chunk_count}</span>
                            </div>
                        \`;
                    });

                    html += \`
                            </div>
                        </div>
                    \`;
                }
            }

            container.innerHTML = html;

            // Update scope badge
            const badge = document.getElementById('active-scope-badge');
            if (badge) {
                badge.textContent = \`\${totalActive} of \${totalAvailable} Active\`;
            }
        }

        function togglePillarSection(pillarId) {
            const el = document.getElementById(\`pillar-\${pillarId}\`);
            if (el) el.classList.toggle('collapsed');
        }

        function filterSidebarStandards(val) {
            renderNotebookLMSidebar(val);
        }

        function toggleStandardCheckbox(event, stdCode) {
            const isCurrentlyChecked = selectedStandardsSet.has(stdCode);
            onStandardCheckboxChanged(stdCode, !isCurrentlyChecked);
            const cb = document.querySelector(\`.std-checkbox[data-std="\${stdCode}"]\`);
            if (cb) cb.checked = !isCurrentlyChecked;
        }

        function onStandardCheckboxChanged(stdCode, checked) {
            if (checked) {
                selectedStandardsSet.add(stdCode);
            } else {
                selectedStandardsSet.delete(stdCode);
            }
            saveSelectedStandards();
            updateSidebarCounts();
        }

        function selectAllStandards(selectAll) {
            if (selectAll) {
                DRILLING_PILLARS.forEach(p => p.standards.forEach(s => selectedStandardsSet.add(s.code)));
                loadedCatalogStandards.forEach(s => selectedStandardsSet.add(s.standard_code));
            } else {
                selectedStandardsSet.clear();
            }
            saveSelectedStandards();
            renderNotebookLMSidebar(document.getElementById('source-search-input')?.value || '');
        }

        function saveSelectedStandards() {
            localStorage.setItem('inspecta_selected_standards', JSON.stringify(Array.from(selectedStandardsSet)));
        }

        function updateSidebarCounts() {
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
        }

        function getActiveStandards() {
            if (selectedStandardsSet.size === 0) return [];
            return Array.from(selectedStandardsSet);
        }

        // ==========================================
        // KNOWLEDGE BASE CURATION PORTAL JS
        // ==========================================
        let currentCuratorPage = 1;
        let totalCuratorPages = 1;
        let selectedChunkIds = new Set();

        function openKnowledgeCurator() {
            const modal = document.getElementById('knowledge-curator-modal');
            if (modal) modal.style.display = 'flex';
            populateCuratorStandardsFilter();
            loadCuratorChunks(1);
        }

        function closeKnowledgeCurator() {
            const modal = document.getElementById('knowledge-curator-modal');
            if (modal) modal.style.display = 'none';
        }

        function populateCuratorStandardsFilter() {
            const sel = document.getElementById('curator-std-select');
            if (!sel) return;
            const currentVal = sel.value;
            let opts = '<option value="">All Standards</option>';

            const seenStds = new Set();
            DRILLING_PILLARS.forEach(p => p.standards.forEach(s => seenStds.add(s.code)));
            loadedCatalogStandards.forEach(s => seenStds.add(s.standard_code));

            Array.from(seenStds).sort().forEach(std => {
                opts += \`<option value="\${std}" \${std === currentVal ? 'selected' : ''}>\${std}</option>\`;
            });
            sel.innerHTML = opts;
        }

        async function loadCuratorChunks(page = 1) {
            currentCuratorPage = page;
            const tbody = document.getElementById('curator-table-body');
            const stdFilter = document.getElementById('curator-std-select')?.value || '';
            const searchVal = document.getElementById('curator-search-input')?.value || '';
            const statusVal = document.getElementById('curator-status-select')?.value || 'all';

            // Show/hide purge button if specific standard is selected
            const purgeBtn = document.getElementById('curator-purge-std-btn');
            if (purgeBtn) {
                purgeBtn.style.display = stdFilter ? 'inline-block' : 'none';
                if (stdFilter) purgeBtn.textContent = \`Purge \${stdFilter}\`;
            }

            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--gemini-text-muted);">Loading database chunks...</td></tr>';
            }

            try {
                let url = \`\${API_BASE}/api/admin/chunks?page=\${page}&limit=25\`;
                if (stdFilter) url += \`&standard_code=\${encodeURIComponent(stdFilter)}\`;
                if (searchVal) url += \`&search=\${encodeURIComponent(searchVal)}\`;
                if (statusVal === 'active') url += \`&is_excluded=0\`;
                if (statusVal === 'excluded') url += \`&is_excluded=1\`;

                const res = await fetch(url);
                const data = await res.json();

                renderCuratorTable(data);
            } catch(e) {
                if (tbody) {
                    tbody.innerHTML = \`<tr><td colspan="8" style="text-align:center; padding:30px; color:#EF4444;">Failed to load chunks: \${e.message}</td></tr>\`;
                }
            }
        }

        function renderCuratorTable(data) {
            const tbody = document.getElementById('curator-table-body');
            const pageInfo = document.getElementById('curator-pagination-info');
            const pageIndicator = document.getElementById('curator-page-indicator');
            const prevBtn = document.getElementById('curator-prev-btn');
            const nextBtn = document.getElementById('curator-next-btn');
            const selectAllCb = document.getElementById('curator-select-all-page');

            if (!tbody) return;

            const chunks = data.chunks || [];
            const total = data.total || 0;
            const limit = data.limit || 25;
            totalCuratorPages = Math.max(1, Math.ceil(total / limit));

            if (selectAllCb) selectAllCb.checked = false;
            selectedChunkIds.clear();
            updateCuratorBulkBar();

            if (pageInfo) {
                const start = total === 0 ? 0 : (currentCuratorPage - 1) * limit + 1;
                const end = Math.min(currentCuratorPage * limit, total);
                pageInfo.textContent = \`Showing \${start}-\${end} of \${total} chunks\`;
            }

            if (pageIndicator) pageIndicator.textContent = \`Page \${currentCuratorPage} of \${totalCuratorPages}\`;
            if (prevBtn) prevBtn.disabled = currentCuratorPage <= 1;
            if (nextBtn) nextBtn.disabled = currentCuratorPage >= totalCuratorPages;

            if (chunks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--gemini-text-muted);">No chunks match your search criteria.</td></tr>';
                return;
            }

            let html = '';
            chunks.forEach(chunk => {
                const isExcluded = Boolean(chunk.is_excluded);
                const statusBadge = isExcluded 
                    ? '<span class="curator-badge-excluded">Excluded</span>' 
                    : '<span class="curator-badge-active">Active</span>';
                
                const excerpt = (chunk.content || '').slice(0, 160).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (chunk.content && chunk.content.length > 160 ? '...' : '');

                html += \`
                    <tr style="border-bottom:1px solid var(--gemini-border);" id="chunk-row-\${chunk.id}">
                        <td style="text-align:center; padding:8px;"><input type="checkbox" class="curator-row-cb" value="\${chunk.id}" onchange="onChunkRowCheck(\${chunk.id}, this.checked)"></td>
                        <td style="padding:8px; font-weight:600; color:var(--gemini-text-muted);">#\${chunk.id}</td>
                        <td style="padding:8px; font-weight:600;">\${chunk.standard_code || '-'}</td>
                        <td style="padding:8px; color:var(--sap-blue); font-weight:600;">\${chunk.clause || '-'}</td>
                        <td style="padding:8px; color:var(--gemini-text-muted); font-size:0.75rem;">\${chunk.section || '-'}</td>
                        <td style="padding:8px; line-height:1.4;" title="\${(chunk.content || '').replace(/"/g, '&quot;')}">\${excerpt}</td>
                        <td style="text-align:center; padding:8px;">\${statusBadge}</td>
                        <td style="text-align:center; padding:8px;">
                            <div style="display:flex; gap:4px; justify-content:center;">
                                <button class="curator-action-btn" title="Edit & Re-Embed" onclick="openCuratorEditModal(\${chunk.id}, '\${(chunk.standard_code||'').replace(/'/g, "\\\\'")}', '\${(chunk.clause||'').replace(/'/g, "\\\\'")}', '\${(chunk.section||'').replace(/'/g, "\\\\'")}', \`\${encodeURIComponent(chunk.content||'')}\`)">✏️</button>
                                <button class="curator-action-btn" title="\${isExcluded ? 'Include Chunk' : 'Exclude Chunk'}" onclick="toggleChunkExclude(\${chunk.id})">\${isExcluded ? '👁️' : '🚫'}</button>
                                <button class="curator-action-btn danger" title="Delete Chunk" onclick="deleteChunk(\${chunk.id})">🗑️</button>
                            </div>
                        </td>
                    </tr>
                \`;
            });

            tbody.innerHTML = html;
        }

        function prevCuratorPage() {
            if (currentCuratorPage > 1) loadCuratorChunks(currentCuratorPage - 1);
        }

        function nextCuratorPage() {
            if (currentCuratorPage < totalCuratorPages) loadCuratorChunks(currentCuratorPage + 1);
        }

        function toggleSelectAllPage(checked) {
            const cbs = document.querySelectorAll('.curator-row-cb');
            cbs.forEach(cb => {
                cb.checked = checked;
                const id = parseInt(cb.value);
                if (checked) selectedChunkIds.add(id);
                else selectedChunkIds.delete(id);
            });
            updateCuratorBulkBar();
        }

        function onChunkRowCheck(id, checked) {
            if (checked) selectedChunkIds.add(id);
            else selectedChunkIds.delete(id);
            updateCuratorBulkBar();
        }

        function updateCuratorBulkBar() {
            const bar = document.getElementById('curator-bulk-bar');
            const cnt = document.getElementById('curator-selected-count');
            if (!bar || !cnt) return;
            if (selectedChunkIds.size > 0) {
                bar.style.display = 'flex';
                cnt.textContent = \`\${selectedChunkIds.size} chunks selected\`;
            } else {
                bar.style.display = 'none';
            }
        }

        function openCuratorEditModal(id, std, clause, section, encContent) {
            const modal = document.getElementById('curator-edit-modal');
            if (!modal) return;
            document.getElementById('edit-chunk-id').value = id;
            document.getElementById('edit-chunk-std').value = std;
            document.getElementById('edit-chunk-clause').value = clause;
            document.getElementById('edit-chunk-section').value = section;
            const content = decodeURIComponent(encContent);
            const textarea = document.getElementById('edit-chunk-content');
            textarea.value = content;
            document.getElementById('edit-chunk-char-count').textContent = content.length + ' chars';
            modal.style.display = 'flex';
        }

        function closeCuratorEditModal() {
            const modal = document.getElementById('curator-edit-modal');
            if (modal) modal.style.display = 'none';
        }

        async function saveCuratorChunk() {
            const id = document.getElementById('edit-chunk-id').value;
            const standard_code = document.getElementById('edit-chunk-std').value.trim();
            const clause = document.getElementById('edit-chunk-clause').value.trim();
            const section = document.getElementById('edit-chunk-section').value.trim();
            const content = document.getElementById('edit-chunk-content').value.trim();
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';

            if (!standard_code || !content) return alert("Standard code and content are required.");

            const saveBtn = document.getElementById('edit-chunk-save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = "Re-Embedding (BAAI)...";
            }

            try {
                const res = await fetch(\`\${API_BASE}/api/admin/chunks/\${id}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: JSON.stringify({ standard_code, clause, section, content })
                });
                const data = await res.json();
                if (data.success) {
                    closeCuratorEditModal();
                    loadCuratorChunks(currentCuratorPage);
                } else {
                    alert("Save Error: " + (data.error || 'Failed to update'));
                }
            } catch(e) {
                alert("Network Error: " + e.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save & Re-Embed";
                }
            }
        }

        async function toggleChunkExclude(id) {
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';
            try {
                const res = await fetch(\`\${API_BASE}/api/admin/chunks/\${id}/toggle-exclude\`, {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await res.json();
                if (data.success) {
                    loadCuratorChunks(currentCuratorPage);
                } else {
                    alert("Toggle Error: " + (data.error || 'Failed to toggle exclusion'));
                }
            } catch(e) {
                alert("Network Error: " + e.message);
            }
        }

        async function deleteChunk(id) {
            if (!confirm(\`Are you sure you want to permanently delete chunk #\${id} from the database?\`)) return;
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';
            try {
                const res = await fetch(\`\${API_BASE}/api/admin/chunks/\${id}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await res.json();
                if (data.success) {
                    loadCuratorChunks(currentCuratorPage);
                } else {
                    alert("Delete Error: " + (data.error || 'Failed to delete'));
                }
            } catch(e) {
                alert("Network Error: " + e.message);
            }
        }

        async function bulkToggleExclude(exclude) {
            if (selectedChunkIds.size === 0) return;
            const ids = Array.from(selectedChunkIds);
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';
            for (const id of ids) {
                try {
                    await fetch(\`\${API_BASE}/api/admin/chunks/\${id}/toggle-exclude\`, {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                } catch(e){}
            }
            loadCuratorChunks(currentCuratorPage);
        }

        async function bulkDeleteChunks() {
            if (selectedChunkIds.size === 0) return;
            if (!confirm(\`Are you sure you want to permanently delete \${selectedChunkIds.size} selected chunks?\`)) return;
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';
            try {
                const res = await fetch(\`\${API_BASE}/api/admin/chunks/bulk-delete\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: JSON.stringify({ chunk_ids: Array.from(selectedChunkIds) })
                });
                const data = await res.json();
                if (data.success) {
                    loadCuratorChunks(currentCuratorPage);
                } else {
                    alert("Bulk Delete Error: " + (data.error || 'Failed to delete'));
                }
            } catch(e) {
                alert("Network Error: " + e.message);
            }
        }

        async function purgeCurrentStandard() {
            const std = document.getElementById('curator-std-select')?.value;
            if (!std) return alert("Select a specific standard to purge.");
            if (!confirm(\`DANGER: Are you sure you want to PURGE ALL CHUNKS AND TABLES for "\${std}"? This action is irreversible.\`)) return;
            const token = localStorage.getItem('inspecta_admin_token') || 'specsupport-admin-2026';
            try {
                const res = await fetch(\`\${API_BASE}/api/admin/standards/\${encodeURIComponent(std)}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await res.json();
                if (data.success) {
                    alert(\`Standard "\${std}" purged successfully (\${data.deleted_chunks} chunks deleted).\`);
                    initNotebookLMSidebar();
                    loadCuratorChunks(1);
                } else {
                    alert("Purge Error: " + (data.error || 'Failed to purge'));
                }
            } catch(e) {
                alert("Network Error: " + e.message);
            }
        }
`;

const domLoadedHook = `        // Auto-load token from storage on startup
        window.addEventListener('DOMContentLoaded', () => {
            const savedToken = localStorage.getItem('inspecta_admin_token') || '';
            const tokenInput = document.getElementById('admin-token');
            if (tokenInput && savedToken) tokenInput.value = savedToken;
            initNotebookLMSidebar();
        });`;

if (!content.includes('NOTEBOOKLM SOURCES SIDEBAR & 4-PILLAR LOGIC')) {
  content = content.replace(`        // Auto-load token from storage on startup
        window.addEventListener('DOMContentLoaded', () => {
            const savedToken = localStorage.getItem('inspecta_admin_token') || '';
            const tokenInput = document.getElementById('admin-token');
            if (tokenInput && savedToken) tokenInput.value = savedToken;
        });`, `${jsLogic}\n${domLoadedHook}`);
  console.log('✓ JS logic & init hook injected');
} else {
  console.log('• JS logic already present');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('index.html successfully updated with NotebookLM UI & Curation Portal!');

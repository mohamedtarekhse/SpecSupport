const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add CSS for special pills if not already present
const cssAnchor = `.mcq-option-pill.selected {
            background: var(--gemini-blue) !important;
            border-color: var(--gemini-blue) !important;
            color: #FFFFFF !important;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(26, 115, 232, 0.4);
        }`;

const newCss = `.mcq-option-pill.selected {
            background: var(--gemini-blue) !important;
            border-color: var(--gemini-blue) !important;
            color: #FFFFFF !important;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(26, 115, 232, 0.4);
        }
        .mcq-option-pill.global-std {
            border-color: rgba(16, 185, 129, 0.4);
            background: rgba(16, 185, 129, 0.08);
            color: #10b981;
        }
        .mcq-option-pill.global-std:hover {
            background: rgba(16, 185, 129, 0.16);
            border-color: #10b981;
        }
        .mcq-option-pill.global-std.selected {
            background: #059669 !important;
            border-color: #059669 !important;
            color: #ffffff !important;
            box-shadow: 0 1px 6px rgba(16, 185, 129, 0.5);
        }
        .mcq-option-pill.custom-spec {
            border-color: rgba(245, 158, 11, 0.4);
            background: rgba(245, 158, 11, 0.08);
            color: #f59e0b;
        }
        .mcq-option-pill.custom-spec:hover {
            background: rgba(245, 158, 11, 0.16);
            border-color: #f59e0b;
        }
        .mcq-option-pill.custom-spec.selected {
            background: #d97706 !important;
            border-color: #d97706 !important;
            color: #ffffff !important;
        }
        .mcq-option-pill.advise-pill {
            border-color: rgba(139, 92, 246, 0.4);
            background: rgba(139, 92, 246, 0.08);
            color: #a78bfa;
        }
        .mcq-option-pill.advise-pill:hover {
            background: rgba(139, 92, 246, 0.16);
            border-color: #8b5cf6;
        }
        .mcq-option-pill.advise-pill.selected {
            background: #7c3aed !important;
            border-color: #7c3aed !important;
            color: #ffffff !important;
        }`;

if (!html.includes('.mcq-option-pill.global-std')) {
  html = html.replace(cssAnchor, newCss);
  console.log('Added CSS for triage pills.');
}

// 2. Ensure streaming extraction of MCQs in appendStreamingMessage
const streamFinalizeOld = `streamMsg.finalize(fullAnswer, streamSources, streamFollowups);`;
const streamFinalizeNew = `let inlineStreamMcqs = [];
                    const streamMcqMatch = fullAnswer.match(/<!--MCQ:\\s*(\\[[\\s\\S]*?\\])\\s*-->/i);
                    if (streamMcqMatch) {
                        try { inlineStreamMcqs = JSON.parse(streamMcqMatch[1]); } catch(e){}
                    }
                    streamMsg.finalize(fullAnswer, streamSources, streamFollowups, inlineStreamMcqs);`;

if (!html.includes('inlineStreamMcqs')) {
  html = html.replace(streamFinalizeOld, streamFinalizeNew);
  console.log('Added stream MCQ extraction in sendMessage.');
}

const finalizeSigOld = `finalize: (finalText, sources = [], followups = []) => {
                    row.remove();
                    appendMessage(finalText, 'ai', sources, followups, finalText.length > 1200, []);
                }`;
const finalizeSigNew = `finalize: (finalText, sources = [], followups = [], mcqs = []) => {
                    row.remove();
                    appendMessage(finalText, 'ai', sources, followups, finalText.length > 1200, mcqs);
                }`;

if (html.includes(finalizeSigOld)) {
  html = html.replace(finalizeSigOld, finalizeSigNew);
  console.log('Updated appendStreamingMessage finalize signature.');
}

// 3. Upgrade MCQ Card Rendering in appendMessage
const mcqBlockOld = `                // Interactive MCQ Refinement Card (Only rendered at tail if conflict exists)
                if (mcqs && mcqs.length > 0) {
                    const mcqCard = document.createElement('div');
                    mcqCard.className = 'interactive-mcq-card';
                    mcqCard.innerHTML = \`
                        <div class="mcq-card-header">
                            <span class="mcq-badge">Specification Conflict Fork</span>
                            <span>Select applicable project path to finalize verdict:</span>
                        </div>
                    \`;

                    const selectedParams = {};

                    mcqs.forEach((mcq, qIdx) => {
                        const qBlock = document.createElement('div');
                        qBlock.className = 'mcq-question-block';
                        qBlock.innerHTML = \`<div class="mcq-question-title">\${qIdx + 1}. \${mcq.question}</div>\`;

                        const grid = document.createElement('div');
                        grid.className = 'mcq-options-grid';

                        mcq.options.forEach(opt => {
                            const pill = document.createElement('button');
                            pill.className = 'mcq-option-pill';
                            pill.textContent = opt;
                            pill.onclick = () => {
                                grid.querySelectorAll('.mcq-option-pill').forEach(p => p.classList.remove('selected'));
                                pill.classList.add('selected');
                                selectedParams[mcq.question] = opt;

                                const refineBtn = mcqCard.querySelector('.mcq-refine-btn');
                                if (refineBtn) refineBtn.disabled = false;
                            };
                            grid.appendChild(pill);
                        });

                        qBlock.appendChild(grid);
                        mcqCard.appendChild(qBlock);
                    });

                    const actionsBar = document.createElement('div');
                    actionsBar.className = 'mcq-actions-bar';
                    const refineBtn = document.createElement('button');
                    refineBtn.className = 'mcq-refine-btn';
                    refineBtn.innerHTML = '⚡ Resolve Conflict with Selected Path';
                    refineBtn.disabled = true;
                    refineBtn.onclick = () => {
                        refineBtn.disabled = true;
                        const paramList = Object.entries(selectedParams).map(([k, v]) => \`- \${k}: \${v}\`).join('\\n');
                        const refineQuery = \`Resolving specification conflict with the following verified project condition:\\n\${paramList}\\n\\nPlease provide the final verified clause verdict.\`;
                        sendMessage(refineQuery);
                    };
                    actionsBar.appendChild(refineBtn);
                    mcqCard.appendChild(actionsBar);

                    tailDiv.appendChild(mcqCard);
                }`;

const mcqBlockNew = `                // Automatic extraction of inline MCQ block if not passed explicitly
                if ((!mcqs || mcqs.length === 0) && text) {
                    const inlineMatch = text.match(/<!--MCQ:\\s*(\\[[\\s\\S]*?\\])\\s*-->/i);
                    if (inlineMatch) {
                        try { mcqs = JSON.parse(inlineMatch[1]); } catch(e){}
                    }
                }

                // Interactive MCQ Refinement & Specification Triage Card
                if (mcqs && mcqs.length > 0) {
                    const isTriage = mcqs.some(m => {
                        const qStr = (m.question || '').toLowerCase();
                        return qStr.includes('base metal') || qStr.includes('thickness') || qStr.includes('governing') || qStr.includes('wps');
                    });

                    const mcqCard = document.createElement('div');
                    mcqCard.className = 'interactive-mcq-card';
                    
                    const headerBadge = isTriage 
                        ? '<span class="mcq-badge" style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3);">⚡ ASME IX / B31.3 Specification Triage</span>'
                        : '<span class="mcq-badge">Specification Conflict Fork</span>';
                    const headerSubtitle = isTriage
                        ? 'Select essential variables or apply the Global Standards Baseline:'
                        : 'Select applicable project path to finalize verdict:';

                    mcqCard.innerHTML = \`
                        <div class="mcq-card-header">
                            \${headerBadge}
                            <span>\${headerSubtitle}</span>
                        </div>
                    \`;

                    const selectedParams = {};
                    let customCompanySpecInput = null;

                    mcqs.forEach((mcq, qIdx) => {
                        const qBlock = document.createElement('div');
                        qBlock.className = 'mcq-question-block';
                        qBlock.innerHTML = \`<div class="mcq-question-title">\${qIdx + 1}. \${mcq.question}</div>\`;

                        const grid = document.createElement('div');
                        grid.className = 'mcq-options-grid';

                        let customInputWrap = null;

                        mcq.options.forEach(opt => {
                            const pill = document.createElement('button');
                            let pillClasses = 'mcq-option-pill';
                            if (opt.includes('🌐 Global')) pillClasses += ' global-std';
                            else if (opt.includes('🏢 Custom')) pillClasses += ' custom-spec';
                            else if (opt.includes('💡 Advise')) pillClasses += ' advise-pill';
                            
                            pill.className = pillClasses;
                            pill.textContent = opt;

                            pill.onclick = () => {
                                grid.querySelectorAll('.mcq-option-pill').forEach(p => p.classList.remove('selected'));
                                pill.classList.add('selected');
                                selectedParams[mcq.question] = opt;

                                if (opt.includes('🏢 Custom')) {
                                    if (!customInputWrap) {
                                        customInputWrap = document.createElement('div');
                                        customInputWrap.className = 'custom-spec-input-container';
                                        customInputWrap.style.cssText = 'margin-top:10px; width:100%; animation:fadeIn 0.2s ease;';
                                        customInputWrap.innerHTML = \`
                                            <input type="text" class="custom-spec-input-field" 
                                                placeholder="Enter client standard (e.g. Aramco SAES-W-011, ADNOC DGS, Shell DEP, Total EP)..." 
                                                style="width:100%; padding:8px 12px; border-radius:8px; background:var(--gemini-card-bg); border:1px solid rgba(245, 158, 11, 0.4); color:var(--gemini-text-main); font-size:0.84rem; outline:none;" />
                                        \`;
                                        qBlock.appendChild(customInputWrap);
                                        customCompanySpecInput = customInputWrap.querySelector('input');
                                    } else {
                                        customInputWrap.style.display = 'block';
                                    }
                                } else if (customInputWrap) {
                                    customInputWrap.style.display = 'none';
                                }

                                const refineBtn = mcqCard.querySelector('.mcq-refine-btn');
                                if (refineBtn) refineBtn.disabled = false;
                            };
                            grid.appendChild(pill);
                        });

                        qBlock.appendChild(grid);
                        mcqCard.appendChild(qBlock);
                    });

                    const actionsBar = document.createElement('div');
                    actionsBar.className = 'mcq-actions-bar';
                    const refineBtn = document.createElement('button');
                    refineBtn.className = 'mcq-refine-btn';
                    
                    if (isTriage) {
                        refineBtn.innerHTML = '⚡ Generate Deterministic ASME Form QW-482 WPS';
                        refineBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                    } else {
                        refineBtn.innerHTML = '⚡ Resolve Conflict with Selected Path';
                    }
                    
                    refineBtn.disabled = true;
                    refineBtn.onclick = () => {
                        refineBtn.disabled = true;
                        
                        if (isTriage) {
                            let refineQuery = 'Please generate the definitive ASME Form QW-482 Welding Procedure Specification (WPS) with the following parameters:\\n';
                            for (const [k, v] of Object.entries(selectedParams)) {
                                refineQuery += \`- \${k}: \${v}\\n\`;
                            }
                            if (customCompanySpecInput && customCompanySpecInput.value.trim()) {
                                refineQuery += \`- Specific Company Spec: \${customCompanySpecInput.value.trim()}\\n\`;
                            }
                            refineQuery += '\\nPlease provide the complete ASME Section IX Form QW-482 table with all essential variables, filler metals, preheat per Table 330.1.1, PWHT per Table 331.1.1, electrical parameters, and NDT acceptance criteria.';
                            sendMessage(refineQuery);
                        } else {
                            const paramList = Object.entries(selectedParams).map(([k, v]) => \`- \${k}: \${v}\`).join('\\n');
                            const refineQuery = \`Resolving specification conflict with the following verified project condition:\\n\${paramList}\\n\\nPlease provide the final verified clause verdict.\`;
                            sendMessage(refineQuery);
                        }
                    };
                    actionsBar.appendChild(refineBtn);
                    mcqCard.appendChild(actionsBar);

                    tailDiv.appendChild(mcqCard);
                }`;

if (html.includes('// Interactive MCQ Refinement Card (Only rendered at tail if conflict exists)')) {
  html = html.replace(mcqBlockOld, mcqBlockNew);
  console.log('Successfully upgraded MCQ card rendering in index.html');
} else {
  console.log('Could not find exact mcqBlockOld');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Saved index.html successfully.');

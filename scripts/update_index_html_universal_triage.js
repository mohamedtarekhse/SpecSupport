const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Target the block in appendMessage
const startTarget = `                // Interactive MCQ Refinement & Specification Triage Card
                if (mcqs && mcqs.length > 0) {`;

const endTarget = `                    actionsBar.appendChild(refineBtn);
                    mcqCard.appendChild(actionsBar);

                    tailDiv.appendChild(mcqCard);
                }`;

const sIdx = html.indexOf(startTarget);
const eIdx = html.indexOf(endTarget);

if (sIdx === -1 || eIdx === -1) {
  console.error('Could not find MCQ block in index.html');
  process.exit(1);
}

const replacement = `                // Interactive MCQ Refinement & Universal Specification Triage Card
                if (mcqs && mcqs.length > 0) {
                    let disciplineType = 'generic';
                    const allQText = mcqs.map(m => m.question || '').join(' ').toLowerCase();

                    if (allQText.includes('base metal') || allQText.includes('wps')) {
                        disciplineType = 'wps';
                    } else if (allQText.includes('ndt examination') || allQText.includes('ndt') || allQText.includes('target ndt')) {
                        disciplineType = 'ndt';
                    } else if (allQText.includes('hydrostatic') || allQText.includes('piping / equipment code') || allQText.includes('design pressure') || allQText.includes('governing piping')) {
                        disciplineType = 'hydrotest';
                    } else if (allQText.includes('asset type') || allQText.includes('shell component') || allQText.includes('fitness')) {
                        disciplineType = 'integrity';
                    } else if (allQText.includes('hoisting') || allQText.includes('structural equipment') || allQText.includes('target inspection category')) {
                        disciplineType = 'hoisting';
                    } else if (allQText.includes('tubular') || allQText.includes('classification tier') || allQText.includes('drill stem')) {
                        disciplineType = 'tubular';
                    } else if (allQText.includes('well control') || allQText.includes('bop') || allQText.includes('rated working pressure')) {
                        disciplineType = 'bop';
                    }

                    const isTriage = disciplineType !== 'generic';

                    let headerBadge = '<span class="mcq-badge">Specification Conflict Fork</span>';
                    let headerSubtitle = 'Select applicable project path to finalize verdict:';
                    let btnLabel = '⚡ Resolve Conflict with Selected Path';
                    let btnBg = 'var(--gemini-blue)';

                    if (disciplineType === 'wps') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3);">⚡ ASME IX / B31.3 Specification Triage</span>';
                        headerSubtitle = 'Select essential variables or apply the Global Standards Baseline:';
                        btnLabel = '⚡ Generate Deterministic ASME Form QW-482 WPS';
                        btnBg = 'linear-gradient(135deg, #059669, #10b981)';
                    } else if (disciplineType === 'ndt') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(59, 130, 246, 0.15); color:#60a5fa; border:1px solid rgba(59, 130, 246, 0.3);">⚡ ASME Section V NDT Examination Triage</span>';
                        headerSubtitle = 'Select examination method & geometry or apply Code Baseline:';
                        btnLabel = '⚡ Generate Deterministic NDT Written Procedure';
                        btnBg = 'linear-gradient(135deg, #2563eb, #3b82f6)';
                    } else if (disciplineType === 'hydrotest') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(14, 165, 233, 0.15); color:#38bdf8; border:1px solid rgba(14, 165, 233, 0.3);">⚡ Hydrostatic & Pressure Testing Triage</span>';
                        headerSubtitle = 'Select piping code & pressure rating or apply Code Baseline:';
                        btnLabel = '⚡ Generate Hydrostatic Test Sequence & Hold Protocol';
                        btnBg = 'linear-gradient(135deg, #0284c7, #0ea5e9)';
                    } else if (disciplineType === 'integrity') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(168, 85, 247, 0.15); color:#c084fc; border:1px solid rgba(168, 85, 247, 0.3);">⚡ API 510 / 570 Fitness-For-Service Triage</span>';
                        headerSubtitle = 'Select asset geometry & damage mechanism:';
                        btnLabel = '⚡ Generate API Retirement Thickness & Remaining Life Evaluation';
                        btnBg = 'linear-gradient(135deg, #7c3aed, #a855f7)';
                    } else if (disciplineType === 'hoisting') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(245, 158, 11, 0.15); color:#fbbf24; border:1px solid rgba(245, 158, 11, 0.3);">⚡ API RP 8B / 4G Hoisting Equipment Triage</span>';
                        headerSubtitle = 'Select equipment scope & Category:';
                        btnLabel = '⚡ Generate API RP 8B Field Inspection Plan & Wear Limits';
                        btnBg = 'linear-gradient(135deg, #d97706, #f59e0b)';
                    } else if (disciplineType === 'tubular') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(234, 88, 12, 0.15); color:#fb923c; border:1px solid rgba(234, 88, 12, 0.3);">⚡ API RP 7G-2 / DS-1 Tubular Triage</span>';
                        headerSubtitle = 'Select tubular scope & target classification tier:';
                        btnLabel = '⚡ Generate API RP 7G-2 Tubular Classification Criteria';
                        btnBg = 'linear-gradient(135deg, #ea580c, #f97316)';
                    } else if (disciplineType === 'bop') {
                        headerBadge = '<span class="mcq-badge" style="background:rgba(239, 68, 68, 0.15); color:#f87171; border:1px solid rgba(239, 68, 68, 0.3);">⚡ API Standard 53 Well Control Triage</span>';
                        headerSubtitle = 'Select BOP stack configuration & working pressure:';
                        btnLabel = '⚡ Generate API 53 Step-by-Step BOP Test Sequence';
                        btnBg = 'linear-gradient(135deg, #dc2626, #ef4444)';
                    }

                    const mcqCard = document.createElement('div');
                    mcqCard.className = 'interactive-mcq-card';
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
                                                placeholder="Enter client standard (e.g. Shell DEP, Aramco SAES, ADNOC DGS, Total EP)..." 
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
                    refineBtn.innerHTML = btnLabel;
                    refineBtn.style.background = btnBg;
                    refineBtn.disabled = true;

                    refineBtn.onclick = () => {
                        refineBtn.disabled = true;
                        
                        if (isTriage) {
                            let refineQuery = \`Please generate the definitive engineering procedure / specification for \${disciplineType.toUpperCase()} with the following parameters:\\n\`;
                            for (const [k, v] of Object.entries(selectedParams)) {
                                refineQuery += \`- \${k}: \${v}\\n\`;
                            }
                            if (customCompanySpecInput && customCompanySpecInput.value.trim()) {
                                refineQuery += \`- Specific Company Spec: \${customCompanySpecInput.value.trim()}\\n\`;
                            }
                            refineQuery += '\\nPlease provide the full deterministic code rules, formulas, hold points, and acceptance criteria based on international standards.';
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

const updatedHtml = html.substring(0, sIdx) + replacement + html.substring(eIdx + endTarget.length);
fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
console.log('Successfully updated index.html with universal triage rendering across 7 disciplines!');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Classification heuristics based on the Universal API Standard Genome
function classifyChunk(chunk) {
    const content = (chunk.content || '').toLowerCase();
    const clause = (chunk.clause || '').toLowerCase();
    const section = (chunk.section || '').toLowerCase();

    // 1. Detect TOC or Publisher Noise
    const dotMatches = content.match(/(?:\.\s*){3,}\s*\d+/g) || [];
    const isPublisherNoise = /black plate|all rights reserved|printed in usa|supersedes|american institute of steel/i.test(content) && content.length < 500;
    const isToc = dotMatches.length >= 2 || (content.includes('table of contents') && dotMatches.length >= 1) || (clause.includes('prelim') || section.includes('prelim'));

    if (isToc || isPublisherNoise) {
        return {
            pillar_type: 'TOC_NOISE',
            is_excluded: 1,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: null,
            qa_docs: null
        };
    }

    // 2. Detect Scope & Demarcation (Pillar 1)
    if (clause.includes('scope') || section.includes('scope') || content.includes('this specification covers') || content.includes('this recommended practice covers') || content.includes('equipment covered') || clause.includes('1.1') || clause.includes('1.2')) {
        let inScope = null;
        let outScope = null;
        if (content.includes('covers') || content.includes('applicable to')) {
            inScope = chunk.content.slice(0, 180).replace(/\n/g, ' ').trim();
        }
        if (content.includes('not cover') || content.includes('excluded') || content.includes('does not apply')) {
            outScope = 'Excluded equipment noted in text';
        }
        return {
            pillar_type: 'SCOPE',
            is_excluded: 0,
            in_scope: inScope,
            out_of_scope: outScope,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: null,
            qa_docs: null
        };
    }

    // 3. Detect Discard & Acceptance Limits (Pillar 2 / Sections 7-8)
    const hasAcceptance = /acceptance criteria|acceptance:|acceptance limits|pass criteria|قبول/i.test(content);
    const hasRejection = /rejection criteria|rejection:|reject:|discard criteria|wear limit|undertolerance|maximum allowable|minimum wall|رفض/i.test(content);
    
    if (hasAcceptance || hasRejection || clause.includes('discard') || clause.includes('wear') || clause.includes('tolerance') || section.includes('discard') || section.includes('wear')) {
        let lines = chunk.content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let acc = lines.find(l => /ACCEPTANCE|Acceptance:|Acceptance Criteria|قبول/i.test(l)) || null;
        let rej = lines.find(l => /REJECTION|Reject:|Rejection Criteria|Discard|رفض/i.test(l)) || null;

        if (!acc && hasAcceptance) acc = 'Referenced in clause specification';
        if (!rej && hasRejection) rej = 'Exceeding dimensional tolerance or fatigue cracking mandates discard';

        return {
            pillar_type: 'DISCARD_LIMITS',
            is_excluded: 0,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: acc ? acc.slice(0, 200).replace(/'/g, "''") : null,
            rejection_limits: rej ? rej.slice(0, 200).replace(/'/g, "''") : null,
            normative_refs: null,
            qa_docs: null
        };
    }

    // 4. Detect Normative References & NDT (Pillar 3 / Section 2)
    if (clause.includes('normative') || section.includes('normative') || clause.includes('reference') || section.includes('reference') || /astm e|asme section v|aws d1\.1|iso 9712|snt-tc-1a|api rp 2x/i.test(content)) {
        const refs = [];
        if (/astm\s*e\s*\d+/i.test(content)) refs.push('ASTM NDT Spec');
        if (/asme\s*(?:sec(?:tion)?\s*)?v\b/i.test(content)) refs.push('ASME Section V');
        if (/aws\s*d1\.1/i.test(content)) refs.push('AWS D1.1');
        if (/asnt|snt-tc-1a|iso\s*9712/i.test(content)) refs.push('ASNT SNT-TC-1A / ISO 9712');
        if (/api\s*1104/i.test(content)) refs.push('API 1104');
        if (/asme\s*(?:sec(?:tion)?\s*)?viii/i.test(content)) refs.push('ASME Section VIII');

        return {
            pillar_type: 'NORMATIVE_REF',
            is_excluded: 0,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: refs.join(', ') || 'Cross-referenced Standard',
            qa_docs: null
        };
    }

    // 5. Detect Quality, Documentation & Records (Pillar 4 / Section 9-10)
    if (/quality|documentation|mill test report|\bmtr\b|certificate of conformance|\bcoc\b|record retention|traceability|marking|stencil|serial number|inspection certificate/i.test(content)) {
        let docs = [];
        if (/mtr|mill test/i.test(content)) docs.push('MTR (EN 10204 3.1/3.2)');
        if (/coc|conformance/i.test(content)) docs.push('Certificate of Conformance (COC)');
        if (/ndt|inspection report/i.test(content)) docs.push('NDT Inspection Report');
        if (/retention|retain/i.test(content)) docs.push('5-Yr / Asset Lifetime Retention');

        return {
            pillar_type: 'QUALITY_DOCS',
            is_excluded: 0,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: null,
            qa_docs: docs.join(', ') || 'QA Audit Documentation'
        };
    }

    // 6. Detect Table / Annex (Pillar 7)
    if (/^table\s*\d+/i.test(clause) || /^table\s*\d+/i.test(section) || /^annex\s*[a-z]/i.test(clause) || /^appendix/i.test(section)) {
        return {
            pillar_type: 'TABLE_ANNEX',
            is_excluded: 0,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: null,
            qa_docs: null
        };
    }

    // 7. Detect Inspection & Overhaul Procedure (Pillar 5 / Category I-IV)
    if (/category\s*(?:i|ii|iii|iv)|cat\s*(?:i|ii|iii|iv)|overhaul|disassembly|assembly|inspection procedure|running practice/i.test(content) || /procedure|maintenance/i.test(clause)) {
        return {
            pillar_type: 'PROCEDURE',
            is_excluded: 0,
            in_scope: null,
            out_of_scope: null,
            acceptance_limits: null,
            rejection_limits: null,
            normative_refs: null,
            qa_docs: null
        };
    }

    return {
        pillar_type: 'GENERAL',
        is_excluded: 0,
        in_scope: null,
        out_of_scope: null,
        acceptance_limits: null,
        rejection_limits: null,
        normative_refs: null,
        qa_docs: null
    };
}

module.exports = { classifyChunk };

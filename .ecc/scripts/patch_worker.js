const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../worker/src/index.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. exactMatches update
const exactTarget = `        const sql = \`
          SELECT id, standard_code, standard_name, section, clause, content, scope, organization 
          FROM standards_chunks 
          WHERE (clause LIKE ? OR section LIKE ? OR content LIKE ?)
            AND (is_excluded = 0 OR is_excluded IS NULL)
          LIMIT 3
        \`
        const param = \`%\${ent.value}%\`
        const { results: exactRes } = await c.env.DB.prepare(sql).bind(param, param, param).all()`;

const exactRepl = `        let sql = \`
          SELECT id, standard_code, standard_name, section, clause, content, scope, organization 
          FROM standards_chunks 
          WHERE (clause LIKE ? OR section LIKE ? OR content LIKE ?)
            AND (is_excluded = 0 OR is_excluded IS NULL)
        \`
        const param = \`%\${ent.value}%\`
        const sqlParams = [param, param, param]
        if (Array.isArray(selected_standards) && selected_standards.length > 0) {
          const placeholders = selected_standards.map(() => '?').join(',')
          sql += \` AND standard_code IN (\${placeholders})\`
          sqlParams.push(...selected_standards)
        }
        sql += \` LIMIT 3\`
        const { results: exactRes } = await c.env.DB.prepare(sql).bind(...sqlParams).all()`;

// Normalize CRLF to LF for matching
const norm = (s) => s.replace(/\r\n/g, '\n');

let normCode = norm(code);

if (normCode.includes(norm(exactTarget))) {
  normCode = normCode.replace(norm(exactTarget), norm(exactRepl));
  console.log('✓ exactTarget replaced');
} else {
  console.error('✗ exactTarget not found');
}

// 2. candidate query update
const candidateTarget = `  if (standard_filter && standard_filter !== 'ALL' && standard_filter !== '🌐 GENERAL AI') {
    query += \` AND standard_code = ?\`
    params.push(standard_filter)
  }`;

const candidateRepl = `  if (Array.isArray(selected_standards) && selected_standards.length > 0) {
    const placeholders = selected_standards.map(() => '?').join(',')
    query += \` AND standard_code IN (\${placeholders})\`
    params.push(...selected_standards)
  } else if (standard_filter && standard_filter !== 'ALL' && standard_filter !== '🌐 GENERAL AI') {
    query += \` AND standard_code = ?\`
    params.push(standard_filter)
  }`;

if (normCode.includes(norm(candidateTarget))) {
  normCode = normCode.replace(norm(candidateTarget), norm(candidateRepl));
  console.log('✓ candidateTarget replaced');
} else {
  console.error('✗ candidateTarget not found');
}

// 3. table query update
const tableTarget = `      if (detectedStd) {
        tblQuery += \` AND standard_code LIKE ?\`
        tblParams.push(\`%\${detectedStd}%\`)
      }`;

const tableRepl = `      if (Array.isArray(selected_standards) && selected_standards.length > 0) {
        const placeholders = selected_standards.map(() => '?').join(',')
        tblQuery += \` AND standard_code IN (\${placeholders})\`
        tblParams.push(...selected_standards)
      } else if (detectedStd) {
        tblQuery += \` AND standard_code LIKE ?\`
        tblParams.push(\`%\${detectedStd}%\`)
      }`;

if (normCode.includes(norm(tableTarget))) {
  normCode = normCode.replace(norm(tableTarget), norm(tableRepl));
  console.log('✓ tableTarget replaced');
} else {
  console.error('✗ tableTarget not found');
}

// 4. /api/ask handler update
const askTarget = `    const { question, language, session_id, standard_filter, history, mode = 'web' } = await c.req.json()
    
    if (!question || !session_id) return c.json({ error: 'Missing fields' }, 400)
    
    let contextData
    try {
      contextData = await prepareContextAndMessages(c, question, language, session_id, standard_filter, history, mode)`;

const askRepl = `    const { question, language, session_id, standard_filter, history, mode = 'web', selected_standards = [] } = await c.req.json()
    
    if (!question || !session_id) return c.json({ error: 'Missing fields' }, 400)
    
    let contextData
    try {
      contextData = await prepareContextAndMessages(c, question, language, session_id, standard_filter, history, mode, selected_standards)`;

if (normCode.includes(norm(askTarget))) {
  normCode = normCode.replace(norm(askTarget), norm(askRepl));
  console.log('✓ askTarget replaced');
} else {
  console.error('✗ askTarget not found');
}

fs.writeFileSync(targetFile, normCode, 'utf8');
console.log('All patches written to worker/src/index.js');

const https = require('https');

const req = https.request('https://inspection-api.mohamedtarekhse.workers.dev/api/admin/cache-purge?force=true', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer specsupport-admin-2026'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('PURGE RESULT:', body);
  });
});
req.on('error', (e) => console.error(e));
req.end();

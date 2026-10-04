const http = require('http');

function makePost(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('Testing Strict Password Invalidation...');
  
  // 1. Reset Admin Password to new password 'NewAdminPass#999'
  const resetRes = await makePost('/api/auth/admin-reset-password', { newPassword: 'NewAdminPass#999' });
  console.log('Reset Password Status:', resetRes.status, resetRes.data.message);

  // 2. Try logging in with OLD initial password 'Sujal957#'
  const oldLoginRes = await makePost('/api/auth/admin-login', { adminId: 'Surya-4034', password: 'Sujal957#' });
  console.log('Old Password Login Attempt Status:', oldLoginRes.status, oldLoginRes.data);

  if (oldLoginRes.status === 401) {
    console.log('✅ CONFIRMED: Old password Sujal957# was STRICTLY REJECTED!');
  } else {
    console.error('❌ ERROR: Old password was accepted!');
  }

  // 3. Try logging in with NEW password 'NewAdminPass#999'
  const newLoginRes = await makePost('/api/auth/admin-login', { adminId: 'Surya-4034', password: 'NewAdminPass#999' });
  console.log('New Password Login Attempt Status:', newLoginRes.status, newLoginRes.data.message);

  if (newLoginRes.status === 200) {
    console.log('✅ CONFIRMED: Only updated password NewAdminPass#999 grants access!');
  }

  // Restore password back to 'Sujal957#'
  await makePost('/api/auth/admin-reset-password', { newPassword: 'Sujal957#' });
})();

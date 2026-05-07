const { Pool } = require('pg');

function getSSLConfig(ssl_mode) {
  let ssl = false;
  if (ssl_mode === 'require' || ssl_mode === 'prefer') {
    ssl = { rejectUnauthorized: false };
  } else if (ssl_mode === 'verify-ca' || ssl_mode === 'verify-full') {
    ssl = { rejectUnauthorized: true };
  }
  return ssl;
}

const testCases = [
  { mode: 'disable', expected: false },
  { mode: 'prefer', expected: { rejectUnauthorized: false } },
  { mode: 'require', expected: { rejectUnauthorized: false } },
  { mode: 'verify-ca', expected: { rejectUnauthorized: true } },
  { mode: 'verify-full', expected: { rejectUnauthorized: true } },
  { mode: undefined, expected: false }
];

console.log('Verifying SSL Configuration Logic:');
testCases.forEach(tc => {
  const result = getSSLConfig(tc.mode);
  const passed = JSON.stringify(result) === JSON.stringify(tc.expected);
  console.log(`Mode: ${tc.mode || 'undefined'} -> Result: ${JSON.stringify(result)} [${passed ? 'PASS' : 'FAIL'}]`);
});

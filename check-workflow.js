const fs = require('fs');
const w = JSON.parse(fs.readFileSync('workflow-blog-publisher-v2.json'));

console.log('=== WORKFLOW CHECK ===\n');

// 1. List all nodes
console.log('NODES (' + w.nodes.length + '):');
const nodeNames = new Set();
w.nodes.forEach(n => {
  nodeNames.add(n.name);
  console.log('  [' + n.typeVersion + '] ' + n.type.split('.').pop() + ' -> "' + n.name + '"');
});

// 2. Check connections
console.log('\nCONNECTIONS (' + Object.keys(w.connections).length + '):');
let errors = [];
for (const [src, conns] of Object.entries(w.connections)) {
  if (!nodeNames.has(src)) {
    errors.push('Source not found: ' + src);
  }
  for (const [connType, outputs] of Object.entries(conns)) {
    for (const arr of outputs) {
      for (const c of arr) {
        if (!nodeNames.has(c.node)) {
          errors.push('Target not found: ' + c.node + ' (from ' + src + ')');
        } else {
          console.log('  ' + src + ' --[' + connType + ']--> ' + c.node);
        }
      }
    }
  }
}

// 3. Report
console.log('\n=== RESULT ===');
if (errors.length === 0) {
  console.log('✓ All connections valid');
} else {
  console.log('✗ ERRORS:');
  errors.forEach(e => console.log('  - ' + e));
}

// 4. Check required fields
console.log('\n=== STRUCTURE CHECK ===');
const required = ['name', 'nodes', 'connections', 'settings'];
required.forEach(f => {
  console.log((w[f] ? '✓' : '✗') + ' ' + f);
});

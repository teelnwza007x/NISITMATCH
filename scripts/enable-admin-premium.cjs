// Run once: node scripts/enable-admin-premium.cjs
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'App.jsx');
let src = fs.readFileSync(file, 'utf8');
const importLine = "import AdminPremiumDirectory from './components/AdminPremiumDirectory'";
if (!src.includes(importLine)) src = importLine + '\n' + src;
const anchor = '<button type="button" className={adminTab === "email"';
const tab = '<button type="button" className={adminTab === "premium" ? "is-active" : ""} onClick={() => setAdminTab("premium")}>สมาชิก Premium</button>';
if (!src.includes(tab)) {
 if (!src.includes(anchor)) throw new Error('Admin tabs location changed. No files written.');
 src = src.replace(anchor, tab + anchor);
}
const panelAnchor = "{adminTab === 'profiles' && <AdminDirectory";
const panel = "{adminTab === 'premium' && <AdminPremiumDirectory/>}";
if (!src.includes(panel)) {
 if (!src.includes(panelAnchor)) throw new Error('Admin panels location changed. No files written.');
 src = src.replace(panelAnchor, panel + '\n    ' + panelAnchor);
}
fs.writeFileSync(file, src);
console.log('Admin Premium tab enabled in src/App.jsx');

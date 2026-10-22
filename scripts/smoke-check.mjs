import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const app = read('src/App.jsx')
const html = read('index.html')
const main = read('src/main.jsx')
const manifest = JSON.parse(read('public/manifest.webmanifest'))
const vercel = JSON.parse(read('vercel.json'))

const checks = [
  ['React root and splash exist', () => {
    assert.match(html, /id="root"/)
    assert.match(html, /id="nm-first-paint"/)
    assert.match(main, /firstPaint\.remove\(\)/)
  }],
  ['PWA metadata is configured', () => {
    assert.equal(manifest.display, 'standalone')
    assert.equal(manifest.start_url, '/')
    assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'))
    assert.match(html, /rel="manifest"/)
  }],
  ['Vercel retains SPA fallback', () => {
    assert.ok(vercel.rewrites.some(rule => rule.destination === '/index.html'))
  }],
  ['Main navigation uses React state', () => {
    assert.match(app, /const go = \(v\) =>/)
    assert.match(app, /setView\(v\)/)
  }],
  ['Hangout notification does not force a page reload', () => {
    const start = app.indexOf("if (p.new.type === 'hangout_message')")
    assert.ok(start >= 0)
    const end = app.indexOf("if (!['interest', 'match'].includes", start)
    assert.ok(end > start)
    assert.doesNotMatch(app.slice(start, end), /window\.location\.reload\(\)/)
  }],
  ['Photo placeholders do not depend on React state updates', () => {
    assert.match(app, /nm-image-loading/)
    assert.match(app, /classList\.remove\("nm-image-loading"\)/)
  }]
]

let failed = 0
for (const [name, check] of checks) {
  try { check(); console.log('PASS', name) }
  catch (error) { failed++; console.error('FAIL', name, error.message) }
}
if (failed) process.exitCode = 1
else console.log('All pre-release smoke checks passed.')

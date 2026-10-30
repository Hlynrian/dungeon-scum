const {readFileSync,existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('dungeon-scum.html','utf8');
const fields=new Set([...html.matchAll(/name="attr_([^"]+)"/g)].map(m=>m[1]));
for(const match of html.matchAll(/@\{([^}]+)\}/g))assert.ok(fields.has(match[1]),'Missing field '+match[1]);
const buttons=[...html.matchAll(/<button type="roll" name="([^"]+)" value="([^"]+)"/g)];
assert.equal(buttons.length,13);
assert.equal(new Set(buttons.map(m=>m[1])).size,buttons.length);
for(const [,name,value] of buttons){
  assert.ok(value.startsWith('&amp;{template:default}'),name+' uses native default template');
  assert.equal((value.match(/\[\[/g)||[]).length,(value.match(/\]\]/g)||[]).length,name+' has balanced inline rolls');
}
const metadata=JSON.parse(readFileSync('sheet.json','utf8'));
assert.equal(metadata.legacy,false);
for(const key of ['html','css','preview'])assert.ok(existsSync(metadata[key]));
assert.equal((html.match(/<fieldset class="repeating_members">/g)||[]).length,1);
console.log('Passed: roll attribute references, unique button names, inline-roll delimiters, repeating section and CSE metadata.');

const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('dungeon-scum.html','utf8').match(/<script type="text\/worker">([\s\S]*?)<\/script>/)[1];
const handlers = {};
let attrs = {}, writes = {};
const context = vm.createContext({on:(events,fn)=>events.split(' ').forEach(e=>handlers[e]=fn),getAttrs:(keys,fn)=>fn(Object.fromEntries(keys.map(k=>[k,attrs[k]]))),setAttrs:v=>Object.assign(writes,v),getSectionIDs:(section,fn)=>fn(['-abc','-xyz'])});
vm.runInContext(source,context);
const calc = v => JSON.parse(JSON.stringify(vm.runInContext('derived('+JSON.stringify(v)+')',context)));
for(const [level,move,save,base,cap] of [['minion',1,1,2,2],['elite',1,2,2,3],['retainer',2,3,2,3],['hero',3,4,3,5]]) {
  const r=calc({level,melee_bonus:'5',missile_bonus:'5'});
  assert.equal(r.move_dice,move); assert.equal(r.save_dice,save);
  assert.equal(r.missile_dice,cap); assert.equal(r.melee_dice,level==='minion'?2:base+5);
}
assert.equal(calc({level:'hero',missile_bonus:'9',stunned:'1'}).missile_dice,4);
assert.equal(calc({level:'retainer',stunned:'1'}).task_dice,1);
assert.equal(calc({level:'hero',armour:'heavy'}).melee_defence,2);
assert.equal(calc({level:'hero',armour:'heavy'}).missile_defence,3);
assert.equal(calc({level:'elite',armour:'none'}).melee_defence,0);
attrs={'repeating_members_-abc_level':'hero','repeating_members_-xyz_level':'minion'};
handlers['sheet:opened']();
assert.equal(writes['repeating_members_-abc_save_dice'],4);
assert.equal(writes['repeating_members_-xyz_save_dice'],1);
attrs['repeating_members_-abc_stunned']='1';
handlers['change:repeating_members:stunned']({sourceAttribute:'repeating_members_-abc_stunned'});
assert.equal(writes['repeating_members_-abc_melee_dice'],2);
assert.equal(writes['repeating_members_-xyz_melee_dice'],2);
console.log('Passed: class pools, caps, stun, armour, sheet-open hydration and repeating-row event isolation.');

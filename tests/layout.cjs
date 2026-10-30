// Browser layout smoke test; requires Playwright and a Chromium executable.
const {readFileSync} = require('node:fs');
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:960,height:900}, deviceScaleFactor:1});
    const html = readFileSync('dungeon-scum.html','utf8').replace(/<script type="text\/worker">[\s\S]*?<\/script>/,'');
    const css = readFileSync('dungeon-scum.css','utf8');
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#e5e0d7}fieldset{border:0;padding:0;margin:0}'+css+'</style></head><body><main class="charsheet">'+html+'</main></body></html>');
    await page.evaluate(() => {
      document.querySelector('[name="attr_character_name"]').value='The Lantern Company';
      document.querySelector('[name="attr_leader"]').value='Mara';
      document.querySelector('[name="attr_gold"]').value='3';
      const section=document.querySelector('fieldset');
      const row=section.firstElementChild;
      ['Mara','Bram','Nettle','Old Tom'].forEach((name,index)=>{
        const member=index?row.cloneNode(true):row;
        member.querySelector('[name="attr_member_name"]').value=name;
        member.querySelector('[name="attr_level"]').value=['hero','retainer','elite','minion'][index];
        member.querySelector('[name="attr_armour"]').value=['light','heavy','none','light'][index];
        if(index)section.append(member);
      });
    });
    assert.equal(await page.locator('.member').count(),4);
    assert.equal(await page.locator('.member details[open]').count(),0);
    for (const width of [960,620]) {
      await page.setViewportSize({width,height:900});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      assert.equal(overflow,false,'Horizontal overflow at '+width);
      const overlapping=await page.locator('.member-top').first().evaluate(el=>{
        const boxes=Array.from(el.children).map(child=>child.getBoundingClientRect());
        return boxes.some((a,i)=>boxes.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
      });
      assert.equal(overlapping,false,'Overlapping controls at '+width);
    }
    await page.locator('.member summary').first().click();
    assert.equal(await page.locator('.member details[open]').count(),1);
    assert.equal(await page.locator('[name="attr_traits"]').first().isVisible(),true);
    await page.locator('.member summary').first().click();
    await page.setViewportSize({width:960,height:900});
    await page.screenshot({path:'screenshot.png',fullPage:true});
    console.log('Passed: four-member compact layout, 960/620px widths, no overlap/overflow, expandable details. Screenshot saved. Roll20 integration requires in-platform testing.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

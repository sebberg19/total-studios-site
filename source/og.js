const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
const svg=fs.readFileSync(process.argv[2],'utf8');
await p.setContent(`<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:630px"><div style="width:620px">${svg.replace(/<\?xml[^>]*>/,'')}</div></body>`);
await p.screenshot({path:'/home/claude/build/assets/og.png'});await b.close()})()

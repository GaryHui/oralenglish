import fs from "node:fs";

const input=process.argv[2],output=process.argv[3]||"public/vocab-10000.json";
if(!input)throw new Error("Usage: node scripts/build-vocab-dataset.mjs <ecdict.csv> [output]");

function parseCsv(text){
 const rows=[];let row=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}
  else if(c==='"')quoted=true;else if(c===','){row.push(field);field=""}else if(c==='\n'){row.push(field.replace(/\r$/, ""));rows.push(row);row=[];field=""}else field+=c;
 }
 if(field||row.length){row.push(field);rows.push(row)}return rows;
}

const rows=parseCsv(fs.readFileSync(input,"utf8"));
const head=rows.shift();const at=Object.fromEntries(head.map((x,i)=>[x,i]));
const posNames={n:"名词",v:"动词",a:"形容词",j:"形容词",r:"副词",d:"副词",p:"介词",c:"连词",u:"助词",m:"数词",q:"量词",x:"其他"};
const cleaned=rows.map(row=>{
 const word=(row[at.word]||"").trim();
 const translation=(row[at.translation]||"").split(/\n|\\n/).map(x=>x.trim()).filter(Boolean).slice(0,2).join("；").slice(0,180);
 const bnc=Number(row[at.bnc])||999999,frq=Number(row[at.frq])||999999,rank=Math.min(bnc,frq);
 const posRaw=(row[at.pos]||"").split("/").sort((a,b)=>(Number(b.split(":")[1])||0)-(Number(a.split(":")[1])||0))[0]?.split(":")[0]||"x";
 return {word,phonetic:(row[at.phonetic]||"").trim(),translation,pos:posNames[posRaw]||"其他",rank,tags:(row[at.tag]||"").trim(),definition:(row[at.definition]||"").split(/\n|\\n/).filter(Boolean)[0]?.slice(0,160)||""};
}).filter(x=>/^[a-z][a-z'-]*$/.test(x.word)&&x.translation&&x.rank<999999);
cleaned.sort((a,b)=>a.rank-b.rank||a.word.localeCompare(b.word));
const seen=new Set(),picked=[];
for(const item of cleaned){if(seen.has(item.word))continue;seen.add(item.word);picked.push(item);if(picked.length===12000)break}
const leveled=picked.map((x,i)=>({...x,level:i<1500?"A1":i<3500?"A2":i<6500?"B1":i<9500?"B2":"C1"}));
fs.writeFileSync(output,JSON.stringify({source:"ECDICT",license:"MIT",generatedAt:new Date().toISOString(),count:leveled.length,words:leveled}));
console.log(`Wrote ${leveled.length} words to ${output}`);

import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import {connectDB} from '../backend/config/db.js';
import {CuratedRecord} from '../backend/routes/author.js';
import {Journal,Opportunity,Conference} from '../backend/models/index.js';
const pack=JSON.parse(await fs.readFile('docs/AUTHOR_SOURCE_PACK.json','utf8'));
await connectDB();const checks=[];
try{
 for(const kind of ['publications','researchers','journals','opportunities','conferences']){
  const queue=[...pack[kind]];
  await Promise.all(Array.from({length:4},async()=>{while(queue.length){const data=queue.shift();const sourceUrl=data.source_url||data.profile_url||data.official_url;let checkStatus='Source supplied; live verification unavailable',httpStatus=0;
   try{const url=kind==='publications'&&data.doi?`https://api.crossref.org/works/${encodeURIComponent(data.doi)}`:sourceUrl;const response=await fetch(url,{signal:AbortSignal.timeout(18000)});httpStatus=response.status;if(response.ok){if(kind==='publications'&&data.doi){const r=(await response.json()).message;if(r?.DOI?.toLowerCase()===data.doi.toLowerCase()){data.title=r.title?.[0]||data.title;data.authors=r.author?.map(a=>[a.given,a.family].filter(Boolean).join(' '))||data.authors;data.venue=r['container-title']?.[0]||data.venue;checkStatus='DOI metadata verified with Crossref; source-pack evidence notes require full-text checking';}}else{const body=(await response.text()).toLowerCase();const terms=(data.name||data.title||'').toLowerCase().match(/[a-z]{5,}/g)||[];const matches=terms.filter(w=>body.includes(w)).length;checkStatus=terms.length&&matches/terms.length>=0.6?'Source page reached and record identity matched; details retain source-pack attribution':'Source page reached; record details need manual verification';}}}catch{}
   await CuratedRecord.updateOne({key:data.id},{$set:{kind,data,sourceUrl,checkedAt:new Date(),checkStatus,httpStatus}},{upsert:true});
   if(kind==='journals')await Journal.updateOne({slug:data.id},{$set:{name:data.title,subject:(data.scope||data.sections||[]).join(', '),description:data.model||`Academic journal. Consult the linked source for aims, policies and current author requirements.`,guidelines:'Follow the official publisher author guidelines. This journal accepts submissions through its own website.',issn:data.online_issn||data.eissn||data.issn,external:true,sourceUrl,sourceCheckedAt:new Date(),sourceDetails:data,synthetic:false}},{upsert:true});
   checks.push({kind,title:data.title||data.name,status:checkStatus,httpStatus});console.log(kind,data.id,httpStatus);
  }}));
 }
 await fs.writeFile('docs/AUTHOR_SOURCE_CHECKS.json',JSON.stringify(checks,null,2));
 console.log('Source records saved:',checks.length);
}finally{await mongoose.disconnect();}

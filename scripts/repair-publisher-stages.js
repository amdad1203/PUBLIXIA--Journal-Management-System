import mongoose from 'mongoose';import fs from 'node:fs/promises';import {connectDB} from '../backend/config/db.js';import * as M from '../backend/models/index.js';import {publisherRecords} from '../backend/services/production.js';import {env} from '../backend/config/env.js';
await connectDB();try{
 const publisher=await M.User.findOne({email:'mimma9087mim@gmail.com'}),editor=await M.User.findOne({demo:true,roles:'editor'}),admin=await M.User.findOne({email:'amdadulhaque1203@gmail.com'});
 const before=(await publisherRecords(publisher)).counts,changes=[];const files=JSON.parse(await fs.readFile('.local-data/presentation-files.json','utf8'));
 for(const code of ['PX-DEMO-0061','PX-DEMO-0062','PX-DEMO-0069','PX-SUP-003']){
 const prior=await M.Manuscript.findOne({code});if(!prior)continue;
 const key=`publisher-stage-repair-v1:${prior.id}`;
 if(await M.Audit.exists({action:key}))continue;
 if(!(await M.User.findById(prior.author))?.demo)throw Error('Only fictional teaching-account records can be staged.');
 const version=await M.Version.findOne({manuscript:prior._id,number:prior.currentVersion});if(!version)throw Error('Missing accepted source version.');
 const prepared=code==='PX-SUP-003';
 // Existing source path is copied deterministically; no third-party content is fetched or certified.
 let proofPath;
 if(prepared){proofPath=`publisher-stage-${prior.id}.txt`;if(!version.text)throw Error('Source text is missing.');await fs.writeFile((await import('node:path')).default.join(env.uploads,proofPath),version.text);files.push(proofPath);}
 await mongoose.connection.transaction(async session=>{
 const m=await M.Manuscript.findById(prior._id).session(session),at=new Date();
 await M.Journal.updateOne({_id:m.journal},{$addToSet:{editors:{$each:[publisher._id,editor._id]}}},{session});
 if(!m.handoff?.at){m.editorialStatus='accepted';m.acceptedVersion=m.currentVersion;m.acceptedBy=editor._id;m.acceptedAt=at;m.handoff={by:editor._id,at,version:m.currentVersion};m.publicationStatus='not_published';m.productionStatus=m.status==='accepted'?'queued':m.status;m.decisions.push({type:'accept',letter:'Legacy classroom production scenario migration; preserved original history. This is prepared training evidence.',by:editor._id,at,version:m.currentVersion});m.productionHistory.push({status:m.productionStatus,note:'Repaired missing legacy classroom handoff without changing the original workflow stage.',by:publisher._id,at});}
 if(prepared){
 const issue=await M.Issue.findOne({journal:m.journal}).session(session);if(!issue)throw Error('Existing issue required.');
 const [formatted]=await M.ManuscriptFile.create([{manuscript:m._id,version:m.acceptedVersion,kind:'production',filename:version.filename,path:version.path,mime:version.mime,size:version.size,text:version.text,uploadedBy:publisher._id}],{session});
 const [proof]=await M.ManuscriptFile.create([{manuscript:m._id,version:m.acceptedVersion,kind:'proof',filename:`${code}-final-proof.txt`,path:proofPath,mime:'text/plain',size:Buffer.byteLength(version.text||''),text:version.text,uploadedBy:publisher._id,state:'approved',sentAt:at,responses:[{decision:'approved',by:m.author,at,note:'Prepared approval for this fictional-account classroom scenario.'}]}],{session});
 for(const status of ['copyediting','typesetting','proof_preparation','proof_sent','approved'])m.productionHistory.push({status,by:status==='approved'?m.author:publisher._id,at,note:'Prepared classroom progression using existing accepted manuscript; no external notification sent.',file:status==='typesetting'?formatted._id:proof._id});
 m.productionStatus='approved';m.issue=issue._id;m.qualityCheck={by:publisher._id,at,file:proof._id,checks:{files:true,metadata:true,proof:true,declarations:true}};
 }
 await m.save({session});await M.Audit.create([{actor:admin._id,action:key,resource:'Manuscript',resourceId:m.id,details:{preparedScenario:true,oldStatus:prior.status,stage:m.productionStatus,preservedHistory:true}}],{session});
 await M.Notification.create([{user:publisher._id,title:prepared?'Prepared proof and quality checks available':'Production relationship repaired',body:`${code}: ${m.productionStatus.replaceAll('_',' ')}. Existing classroom workflow linked to this journal.`,link:`/manuscripts/${m._id}`,category:'production',eventKey:key,email:{state:'skipped',attempts:0,lastError:'In-app staging notice; external email disabled.'}}],{session});changes.push({code,stage:m.productionStatus});
 });
 }
 await fs.writeFile('.local-data/presentation-files.json',JSON.stringify([...new Set(files)],null,2));const after=await publisherRecords(publisher);const report={at:new Date(),before,after:after.counts,changes,createdManuscripts:0,records:after.records.map(m=>({code:m.code,stage:m.stage})),totalManuscripts:await M.Manuscript.countDocuments()};await fs.writeFile('docs/publisher-repair-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await mongoose.disconnect();}

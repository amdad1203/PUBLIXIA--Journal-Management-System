import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {connectDB} from '../backend/config/db.js';
import * as M from '../backend/models/index.js';
import {storeFile} from '../backend/services/files.js';

// Supplemental classroom identities. No existing credentials or manuscript states are changed.
const summary={created:{},reused:{},membershipsAdded:0,errors:[]};
async function ensure(Model,filter,values){const prior=await Model.findOne(filter);if(prior){summary.reused[Model.modelName]=(summary.reused[Model.modelName]||0)+1;return prior;}const row=await Model.findOneAndUpdate(filter,{$setOnInsert:values},{upsert:true,returnDocument:'after'});summary.created[Model.modelName]=(summary.created[Model.modelName]||0)+1;return row;}
await connectDB();
try {
 const editor=await M.User.findOne({email:'amdadboss11@gmail.com'}),publisher=await M.User.findOne({email:'mimma9087mim@gmail.com'}),admin=await M.User.findOne({email:'amdadulhaque1203@gmail.com'});
 if(!editor||!publisher||!admin)throw Error('Existing presentation staff must be present.');
 const before={users:await M.User.countDocuments(),journals:await M.Journal.countDocuments(),manuscripts:await M.Manuscript.countDocuments(),reviews:await M.Review.countDocuments()};
 let reviewerCount=await M.User.countDocuments({roles:'reviewer',active:true});
 const subjects=['Cybersecurity','Data science','Environmental methods','Software engineering','Artificial intelligence','Research reporting'];
 for(let i=1;reviewerCount<8&&i<=20;i++){
   // Stable slots are chosen independently of the current count, so reruns only fill genuinely missing accounts.
   const email=`supplement-reviewer-${i}@example.test`;if(await M.User.exists({email}))continue;
   await ensure(M.User,{email},{email,name:`Review Specialist ${i} (classroom)`,roles:['reviewer'],passwordHash:await bcrypt.hash('12345',12),demo:true,emailVerified:false,emailNotifications:false,active:true,interests:subjects[i-1]||'Research methods',bio:'Fictional classroom reviewer account; expertise describes its teaching scenario.',reviewerCapacity:8});reviewerCount++;
 }
 const assigned=await M.Journal.find({editors:editor._id,external:{$ne:true}}).sort({slug:1});
 const additional=assigned.length>=5?[]:await M.Journal.find({synthetic:true,external:{$ne:true},_id:{$nin:assigned.map(j=>j._id)}}).sort({slug:1}).limit(Math.max(0,5-assigned.length));
 for(const j of additional){const result=await M.Journal.updateOne({_id:j._id},{$addToSet:{editors:{$each:[editor._id,publisher._id]}}});if(result.modifiedCount){summary.membershipsAdded++;await M.Audit.create({actor:admin._id,action:'journal.staff_added',resource:'Journal',resourceId:String(j._id),details:{source:'editor-admin-supplement-v1',added:[editor._id,publisher._id]}});}}
 // Fill only missing modern decision/handoff examples. Existing legacy records remain untouched.
 const j=await M.Journal.findOne({slug:'publixia-practice-and-methods'});
 const author=await M.User.findOne({demo:true,roles:'researcher'});
 const teachingEditor=await M.User.findOne({demo:true,roles:'editor'});
 const reviewer=await M.User.findOne({email:'supplement-reviewer-1@example.test'});
 if(j&&author&&teachingEditor&&reviewer){
 await M.Journal.updateOne({_id:j._id},{$addToSet:{editors:teachingEditor._id}});
 const scenarios=[['Evidence-quality checklist for software benchmark comparisons','under_review','not_started'],['Reporting uncertainty in low-cost air-quality measurements','under_review','not_started'],['A protocol for evaluating privacy risks in educational datasets','accepted','queued'],['Transparent documentation for water-quality sensor calibration','accepted','proof_sent'],['A methodological checklist for reproducible data-cleaning pipelines','published','published'],['Protocol reporting for energy-aware network simulations','published','published']];
 const issue=await ensure(M.Issue,{journal:j._id,volume:2,number:1},{journal:j._id,volume:2,number:1,title:'Methods and reporting protocols'});
 let files=[];try{files=JSON.parse(await fs.readFile('.local-data/presentation-files.json','utf8'));}catch{}
 for(let i=0;i<scenarios.length;i++){
 const [title,status,productionStatus]=scenarios[i],code=`PX-SUP-${String(i+1).padStart(3,'0')}`,at=new Date('2026-11-10T08:00:00Z');
 const accepted=status!=='under_review';
 const m=await ensure(M.Manuscript,{code},{code,title,abstract:'This methods protocol defines evidence-selection criteria, reproducibility records, uncertainty reporting and limitations. It proposes an evaluation procedure and reports no new empirical findings.',keywords:'methods, reproducibility, reporting',journal:j._id,author:author._id,currentVersion:1,status,editorialStatus:accepted?'accepted':'under_review',productionStatus,publicationStatus:status==='published'?'published':'not_published',submittedAt:at,synthetic:false,declarations:{ethics:'No participant data collected.',consent:'Not applicable to this protocol.',conflicts:'Classroom workflow content.',funding:'No funding claimed.',data:'No new experimental data.',ai:'AI-assisted classroom protocol; source claims require verification.',contributions:'Prepared workflow scenario with fictional academic accounts.'},history:[{status:'submitted',at,by:author._id,note:'Supplemental classroom scenario, dataset editor-admin-v1.'},{status,at,by:teachingEditor._id,note:'Prepared scenario state; not an external scientific endorsement.'}],...(accepted?{acceptedVersion:1,acceptedBy:teachingEditor._id,acceptedAt:at,handoff:{by:teachingEditor._id,at,version:1},decisions:[{type:'accept',letter:'Prepared assessment: the protocol clearly distinguishes proposed procedures from measured results.',by:teachingEditor._id,at,version:1}],productionHistory:[{status:productionStatus,by:publisher._id,at,note:'Prepared classroom production state.'}]}:{}),...(status==='published'?{publishedAt:at,issue:issue._id,doiStatus:'pending'}:{})});
 const content=`${title}\n\nTeaching protocol\nThis document is a classroom workflow case. No empirical results or real-world peer-review certification are asserted.\n\nPurpose\nDefine a reproducible evaluation protocol and document its assumptions before conducting a study.\n\nMethods\nRecord the research question, data provenance, eligibility criteria, baseline, measurement procedure and uncertainty analysis. Preserve original observations and all preprocessing decisions. Compare alternative assumptions using a pre-specified sensitivity analysis.\n\nReporting checklist\nDocument sample selection, missing data, software versions, licensing, ethical constraints and known limitations. Keep planned analysis separate from observations.\n\nLimitations\nThe protocol requires domain review and actual measurements before any scientific performance claim.\n`;
 if(!await M.Version.exists({manuscript:m._id,number:1})){const buffer=Buffer.from(content),file=await storeFile({buffer},'.txt');await ensure(M.Version,{manuscript:m._id,number:1},{manuscript:m._id,number:1,filename:`${code}.txt`,path:file,mime:'text/plain',size:buffer.length,text:content});files.push(file);}
 const assignment=await ensure(M.Assignment,{manuscript:m._id,reviewer:reviewer._id,round:1},{manuscript:m._id,reviewer:reviewer._id,round:1,editor:teachingEditor._id,due:new Date('2026-11-20T08:00:00Z'),status:'completed',submittedAt:at});
 if(i===1){const second=await M.User.findOne({email:'supplement-reviewer-2@example.test'});if(second)await ensure(M.Assignment,{manuscript:m._id,reviewer:second._id,round:1},{manuscript:m._id,reviewer:second._id,round:1,editor:teachingEditor._id,due:new Date('2026-11-13T08:00:00Z'),status:'accepted',respondedAt:at,conflictDeclared:false});}
 await ensure(M.Review,{assignment:assignment._id},{assignment:assignment._id,manuscript:m._id,reviewer:reviewer._id,recommendation:accepted?'accept':'minor_revision',scores:{originality:3,methodology:4,results:3,presentation:4},authorComments:'Clarify the eligibility criteria and distinguish planned analyses from observations. Explain the sensitivity analysis and the conditions under which conclusions would change.',confidentialComments:'Classroom assessment by a fictional reviewer. No experimental results have been independently validated.'});
 if(['proof_sent','published'].includes(productionStatus)&&!await M.ManuscriptFile.exists({manuscript:m._id,kind:'proof'})){const buffer=Buffer.from(content),file=await storeFile({buffer},'.txt');const proof=await ensure(M.ManuscriptFile,{manuscript:m._id,kind:'proof'},{manuscript:m._id,kind:'proof',version:1,filename:`${code}-proof.txt`,path:file,mime:'text/plain',size:buffer.length,text:content,uploadedBy:publisher._id,state:status==='published'?'approved':'sent',sentAt:at,responses:status==='published'?[{decision:'approved',note:'Prepared author approval for classroom workflow.',by:author._id,at}]:[]});files.push(file);if(status==='published')await M.Manuscript.updateOne({_id:m._id,'qualityCheck.at':{$exists:false}},{$set:{qualityCheck:{by:publisher._id,at,file:proof._id,checks:{files:true,metadata:true,proof:true,declarations:true}}}});}
 await ensure(M.Audit,{action:'supplement.scenario_prepared',resource:'Manuscript',resourceId:String(m._id)},{actor:admin._id,action:'supplement.scenario_prepared',resource:'Manuscript',resourceId:String(m._id),details:{dataset:'editor-admin-v1'}});
 }
 await fs.writeFile('.local-data/presentation-files.json',JSON.stringify([...new Set(files)],null,2));
 }
 const journalIds=await M.Journal.find({editors:editor._id}).distinct('_id');
 const visible=await M.Manuscript.find({journal:{$in:journalIds}}).select('code status currentVersion');
 summary.before=before;summary.editorVisibleManuscripts=visible.length;
 summary.existingStages=visible.reduce((o,m)=>(o[m.status]=(o[m.status]||0)+1,o),{});
 summary.after={users:await M.User.countDocuments(),journals:await M.Journal.countDocuments(),manuscripts:await M.Manuscript.countDocuments(),reviews:await M.Review.countDocuments()};
 await fs.mkdir('docs',{recursive:true});await fs.writeFile('docs/editor-admin-supplement-summary.json',JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary,null,2));
}catch(error){summary.errors.push(error.message);console.error(error.message);process.exitCode=1;}finally{await mongoose.disconnect();}

import {Journal,Manuscript,ManuscriptFile,Version,Issue} from '../models/index.js';

// One classification feeds both cards and lists; approval alone is not release readiness.
export function productionStage(m,proof,validIssue=false,validVersion=true){
 if(!validVersion||!m.handoff?.at||m.editorialStatus!=='accepted')return null;
 if(m.publicationStatus==='published')return m.publishedAt&&validIssue&&proof?.state==='approved'?'published':null;
 if(m.productionStatus==='queued')return 'waiting';
 if(['proof_sent','corrections_pending'].includes(m.productionStatus))return 'awaiting';
 const checks=m.qualityCheck?.checks;
 if(m.productionStatus==='approved'&&proof?.state==='approved'&&String(m.qualityCheck?.file)===String(proof._id)&&validIssue&&m.title&&m.abstract&&m.keywords&&['files','metadata','proof','declarations'].every(k=>checks?.[k]===true))return 'ready';
 return 'in_production';
}
export async function publisherRecords(user){
 const journals=await Journal.find({editors:user._id}).select('name').lean();
 const manuscripts=await Manuscript.find({journal:{$in:journals.map(j=>j._id)},editorialStatus:'accepted','handoff.at':{$exists:true}})
 .select('code title abstract keywords author journal editorialStatus productionStatus publicationStatus acceptedVersion handoff updatedAt publishedAt issue doi doiStatus qualityCheck')
 .populate('journal','name').populate('author','name affiliation').sort({updatedAt:-1}).lean();
 const ids=manuscripts.map(m=>m._id);
 const [proofs,versions,issues]=await Promise.all([ManuscriptFile.find({manuscript:{$in:ids},kind:'proof'}).select('manuscript version state filename sentAt responses updatedAt').sort({createdAt:-1}).lean(),Version.find({manuscript:{$in:ids}}).select('manuscript number').lean(),Issue.find({journal:{$in:journals.map(j=>j._id)}}).select('journal').lean()]);
 const records=manuscripts.map(m=>{const proof=proofs.find(f=>String(f.manuscript)===String(m._id)&&f.version===m.acceptedVersion);const validIssue=issues.some(i=>String(i._id)===String(m.issue)&&String(i.journal)===String(m.journal._id));return {...m,proof,stage:productionStage(m,proof,validIssue,versions.some(v=>String(v.manuscript)===String(m._id)&&v.number===m.acceptedVersion))};}).filter(m=>m.stage);
 return {journals,records,counts:Object.fromEntries(['waiting','in_production','awaiting','ready','published'].map(s=>[s,records.filter(m=>m.stage===s).length]))};
}

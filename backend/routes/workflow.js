import { z } from 'zod';
import path from 'node:path';
import { Assignment, Journal, Manuscript, ManuscriptFile, Version, User } from '../models/index.js';
import { allow, hasRole } from '../middleware/auth.js';
import { manuscriptAccess } from '../services/access.js';
import { audit, journalNotice, expireInvitations } from '../services/lifecycle.js';
import { notify } from '../services/notifications.js';
import { upload, extract, storeFile } from '../services/files.js';
import { id, text, parse, fail, same, date } from '../utils/http.js';
import { editorialOf, productionOf } from '../../shared/workspaces.js';
import { env } from '../config/env.js';

export const reviewFields=z.object({recommendation:z.enum(['accept','minor_revision','major_revision','reject']),scores:z.object({originality:z.number().int().min(1).max(5),methodology:z.number().int().min(1).max(5),results:z.number().int().min(1).max(5),presentation:z.number().int().min(1).max(5)}),authorComments:text(20000,0),confidentialComments:text(20000,0).default('')});
export function installWorkflowRoutes(router) {
  router.post('/manuscripts/:id/quality-check',allow('publisher'),async(req,res)=>{
    const {m,production}=await manuscriptAccess(req.user,req.params.id);
    if(!production)fail(403,'Assigned Publisher access required.');
    if(m.productionStatus!=='approved'||m.publicationStatus==='published')fail(409,'Author approval is required before final quality checks.');
    const b=parse(z.object({issue:id,checks:z.object({files:z.literal(true),metadata:z.literal(true),proof:z.literal(true),declarations:z.literal(true)})}),req);
    const proof=await ManuscriptFile.findOne({manuscript:m._id,kind:'proof'}).sort({createdAt:-1});
    const {Issue}=await import('../models/index.js');
    if(!proof||proof.state!=='approved'||proof.version!==m.acceptedVersion)fail(409,'Latest accepted-version proof must be approved.');
    if(!m.title||!m.abstract||!m.keywords||!await Issue.exists({_id:b.issue,journal:m.journal}))fail(400,'Complete metadata and select an issue from this journal.');
    m.issue=b.issue;m.qualityCheck={by:req.user._id,at:new Date(),file:proof._id,checks:b.checks};await m.save();
    await audit(req.user,'production.quality_checked','Manuscript',m._id);res.json({ok:true});
  });
  router.get('/editorial/assignments',allow('editor'),async(req,res)=>{
    await expireInvitations();
    const journals=await Journal.find({editors:req.user._id}).distinct('_id');
    const manuscripts=await Manuscript.find({journal:{$in:journals},status:{$ne:'draft'}}).distinct('_id');
    res.json(await Assignment.find({manuscript:{$in:manuscripts}}).select('-draft -draftHistory').populate('reviewer','name affiliation interests reviewerAvailable reviewerCapacity').populate({path:'manuscript',select:'title code status currentVersion journal',populate:{path:'journal',select:'name'}}).sort({due:1}).limit(200));
  });
  router.put('/assignments/:id/draft',allow('reviewer'),async(req,res)=>{
    id.parse(req.params.id);const b=parse(reviewFields,req);
    const a=await Assignment.findOne({_id:req.params.id,reviewer:req.user._id,status:'accepted'});
    if(!a)fail(403,'Only an accepted, unsubmitted review can be saved.');
    const m=await Manuscript.findById(a.manuscript);
    if(editorialOf(m)!=='under_review'||a.round!==m.currentVersion)fail(409,'This review round is not open.');
    if(a.draftHistory.length>=100)fail(409,'Draft version limit reached. Submit your report or contact the editor.');
    a.draft=b;a.draftHistory.push({data:b,by:req.user._id,at:new Date()});await a.save();
    await audit(req.user,'review.draft_saved','Manuscript',m._id);res.json({savedAt:a.updatedAt,draft:a.draft});
  });
  router.post('/assignments/:id/manage',allow('editor'),async(req,res)=>{
    id.parse(req.params.id);const b=parse(z.object({action:z.enum(['remind','cancel','extend']),due:date,responseDue:date,note:text(2000,0).default('')}),req);
    const a=await Assignment.findById(req.params.id);if(!a)fail(404,'Assignment not found.');
    await manuscriptAccess(req.user,String(a.manuscript),'editor');
    if(!['invited','accepted'].includes(a.status))fail(409,'Only an open assignment can be managed.');
    if(b.action==='cancel')a.status='cancelled';
    if(b.action==='extend') {
      if(!b.due||new Date(b.due)<=new Date())fail(400,'Choose a future review deadline.');
      a.due=b.due;
      if(b.responseDue){if(new Date(b.responseDue)>=new Date(b.due)||new Date(b.responseDue)<=new Date())fail(400,'Response deadline must be before review deadline and in the future.');a.responseDue=b.responseDue;}
    }
    if(b.action==='remind'&&a.events.some(e=>e.action==='remind'&&e.at>new Date(Date.now()-3600000)))fail(429,'A reminder was already sent within the last hour.');
    a.events.push({action:b.action,note:b.note,by:req.user._id,at:new Date()});await a.save();
    await notify(a.reviewer,`Review assignment: ${b.action}`,b.note||'Open your review workspace for the updated assignment.','/reviews','review');
    await audit(req.user,`review.${b.action}`,'Manuscript',a.manuscript);res.json(a.toObject({transform:(_,ret)=>{delete ret.draft;delete ret.draftHistory;return ret;}}));
  });
  router.post('/manuscripts/:id/screening-checklist',allow('editor'),async(req,res)=>{
    const {m}=await manuscriptAccess(req.user,req.params.id,'editor');
    if(!['submitted','screening'].includes(editorialOf(m)))fail(409,'Screening is not open.');
    const b=parse(z.object({checks:z.object({scope:z.boolean(),files:z.boolean(),declarations:z.boolean(),readability:z.boolean()}),note:text(3000,0).default('')}),req);
    m.screeningChecks.push({...b,by:req.user._id,at:new Date(),version:m.currentVersion});await m.save();await audit(req.user,'editorial.screening_saved','Manuscript',m._id);res.json({ok:true});
  });
  router.post('/manuscripts/:id/handoff',allow('editor'),async(req,res)=>{
    const {m}=await manuscriptAccess(req.user,req.params.id,'editor');
    if(editorialOf(m)!=='accepted'||m.status==='published')fail(409,'Only an accepted unpublished manuscript can be handed off.');
    if(m.handoff?.at)fail(409,'This manuscript has already been handed off.');
    if(!await Version.exists({manuscript:m._id,number:m.currentVersion}))fail(409,'The accepted version is missing.');
    m.editorialStatus='accepted';m.acceptedVersion=m.currentVersion;
    m.handoff={by:req.user._id,at:new Date(),version:m.currentVersion};m.productionStatus='queued';m.publicationStatus='not_published';
    m.productionHistory.push({status:'queued',note:'Existing accepted version handed to production.',by:req.user._id,at:new Date()});await m.save();
    await audit(req.user,'production.handoff','Manuscript',m._id);await journalNotice(m,['publisher'],'Accepted manuscript ready for production',m.title);res.json({ok:true});
  });
  router.post('/manuscripts/:id/files',upload.single('file'),async(req,res)=>{
    const {m,owner,editor,production}=await manuscriptAccess(req.user,req.params.id);
    const kind=z.enum(['supplement','blinded','production','proof']).parse(req.body.kind);
    if(kind==='supplement'&&(!owner||!['draft','revision'].includes(editorialOf(m))))fail(403,'Only the author can upload supporting files during preparation.');
    if(kind==='blinded'&&(!editor||!['screening','under_review'].includes(editorialOf(m))))fail(403,'Only the assigned Editor can prepare review files.');
    if(['production','proof'].includes(kind)&&(!production||m.publicationStatus==='published'))fail(403,'Publisher production access required.');
    if(kind==='proof'&&!['proof_preparation','corrections_pending','approved'].includes(productionOf(m)))fail(409,'Prepare the proof after typesetting.');
    const extracted=await extract(req.file);const stored=await storeFile(req.file,extracted.ext);
    const file=await ManuscriptFile.create({manuscript:m._id,version:kind==='proof'||kind==='production'?m.acceptedVersion:m.currentVersion,kind,filename:path.basename(req.file.originalname),path:stored,mime:extracted.ext==='.pdf'?'application/pdf':extracted.ext==='.docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/plain',size:req.file.size,text:extracted.text,uploadedBy:req.user._id});
    if(kind==='proof'){m.productionStatus='proof_preparation';m.qualityCheck=undefined;await m.save();}
    await audit(req.user,`file.${kind}_uploaded`,'Manuscript',m._id);res.status(201).json({_id:file._id,filename:file.filename,kind});
  });
  router.get('/manuscripts/:id/files/:file/download',async(req,res)=>{
    const {m,owner,editor,production,assignment}=await manuscriptAccess(req.user,req.params.id);id.parse(req.params.file);
    const f=await ManuscriptFile.findOne({_id:req.params.file,manuscript:m._id});if(!f)fail(404,'File not found.');
    const j=await Journal.findById(m.journal);
    if(!owner&&!editor&&!production){
      if(!assignment||!['accepted','completed'].includes(assignment.status)||f.version!==assignment.round)fail(403,'Accept an invitation before accessing its review files.');
      if(j.reviewPolicy?.model==='double_blind'?f.kind!=='blinded':!['blinded','supplement'].includes(f.kind))fail(403,'This file is not available to reviewers.');
    }
    if(owner&&f.kind==='proof'&&f.state==='uploaded')fail(403,'The publisher has not released this proof.');
    if(production&&['blinded','supplement'].includes(f.kind))fail(403,'This file belongs to editorial review.');
    res.download(path.join(env.uploads,path.basename(f.path)),f.filename);
  });
  router.post('/manuscripts/:id/proofs/:file/send',allow('publisher'),async(req,res)=>{
    const {m,production}=await manuscriptAccess(req.user,req.params.id);if(!production)fail(403,'Assigned publisher access required.');
    const f=await ManuscriptFile.findOne({manuscript:m._id,kind:'proof'}).sort({createdAt:-1});
    if(!f||String(f._id)!==req.params.file||f.state!=='uploaded')fail(409,'Send the latest uploaded proof.');
    if(m.publicationStatus==='published')fail(409,'Publication is already complete.');
    f.state='sent';f.sentAt=new Date();await f.save();m.productionStatus='proof_sent';m.productionHistory.push({status:'proof_sent',by:req.user._id,at:new Date(),file:f._id});await m.save();
    await notify(m.author,'Author proof ready','Review the latest proof and approve it or request corrections.',`/manuscripts/${m._id}`,'proof');await audit(req.user,'proof.sent','Manuscript',m._id);res.json({ok:true});
  });
  router.post('/manuscripts/:id/proofs/:file/respond',allow('researcher'),async(req,res)=>{
    const {m}=await manuscriptAccess(req.user,req.params.id,'owner');const b=parse(z.object({decision:z.enum(['approved','corrections_pending']),note:text(5000,0).default('')}),req);
    const f=await ManuscriptFile.findOne({manuscript:m._id,kind:'proof'}).sort({createdAt:-1});
    if(!f||String(f._id)!==req.params.file||f.state!=='sent'||m.productionStatus!=='proof_sent')fail(409,'Only the latest sent proof can receive a response.');
    if(b.decision==='corrections_pending'&&b.note.length<10)fail(400,'Describe the requested corrections.');
    f.state=b.decision;f.responses.push({...b,by:req.user._id,at:new Date()});await f.save();m.productionStatus=b.decision;m.productionHistory.push({status:b.decision,note:b.note,by:req.user._id,at:new Date(),file:f._id});await m.save();
    await journalNotice(m,['publisher'],b.decision==='approved'?'Author proof approved':'Author proof corrections requested',b.note||m.title);await audit(req.user,`proof.${b.decision}`,'Manuscript',m._id);res.json({ok:true});
  });
  router.post('/manuscripts/:id/production',allow('publisher'),async(req,res)=>{
    const {m,production}=await manuscriptAccess(req.user,req.params.id);if(!production)fail(403,'Only an accepted, handed-off manuscript is available to the assigned Publisher.');
    const b=parse(z.object({status:z.enum(['copyediting','typesetting','proof_preparation','published']),note:text(5000,10),issue:id.optional(),doi:text(200,0).optional(),checks:z.object({files:z.literal(true),metadata:z.literal(true),proof:z.literal(true),declarations:z.literal(true)}).optional()}),req);
    const allowed={queued:['copyediting'],copyediting:['typesetting'],typesetting:['proof_preparation'],approved:['published']};
    if(!allowed[productionOf(m)]?.includes(b.status))fail(409,'Complete the production stages and author approval in order.');
    if(b.status==='proof_preparation'&&!await ManuscriptFile.exists({manuscript:m._id,kind:'production',version:m.acceptedVersion}))fail(409,'Upload the formatted production file first.');
    if(b.status==='published') {
      if(!b.checks)fail(400,'Confirm all final quality checks.');
      const proof=await ManuscriptFile.findOne({manuscript:m._id,kind:'proof'}).sort({createdAt:-1});
      if(!proof||proof.state!=='approved'||proof.version!==m.acceptedVersion)fail(409,'The author must approve the latest proof of the accepted version.');
      const {Issue}=await import('../models/index.js');
      if(!b.issue||!await Issue.exists({_id:b.issue,journal:m.journal}))fail(400,'Select an issue belonging to this journal.');
      if(b.doi&&!/^10\.\d{4,9}\/\S+$/.test(b.doi))fail(400,'Enter a DOI in the expected format or leave it empty.');
      m.issue=b.issue;m.doi=b.doi||undefined;m.doiStatus=b.doi?'provided':'pending';m.publicationStatus='published';m.publishedAt=new Date();m.status='published';
      m.qualityCheck={by:req.user._id,at:new Date(),file:proof._id,checks:b.checks};
    }
    m.editorialStatus='accepted';m.productionStatus=b.status;m.productionHistory.push({status:b.status,note:b.note,by:req.user._id,at:new Date()});await m.save();await audit(req.user,`production.${b.status}`,'Manuscript',m._id);
    await notify(m.author,b.status==='published'?'Article published':'Production progress updated',`${m.code}: ${b.status.replaceAll('_',' ')}`,b.status==='published'?`/articles/${m._id}`:`/manuscripts/${m._id}`,'production');
    if(b.status==='published')await journalNotice(m,['editor'],'Journal manuscript published',m.title);res.json({ok:true});
  });
}

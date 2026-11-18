import { z } from 'zod';
import { Assignment, Journal, Manuscript, ManuscriptFile, Version } from '../models/index.js';
import { hasRole } from '../middleware/auth.js';
import { manuscriptAccess } from './access.js';
import { parse, text, date, fail, same } from '../utils/http.js';
import { editorialOf } from '../../shared/workspaces.js';
import { audit, journalNotice } from './lifecycle.js';
import { notify } from './notifications.js';

export async function changeEditorialStatus(req,res) {
  const b=parse(z.object({status:z.enum(['submitted','withdrawn','screening','under_review','revision','accepted','rejected']),note:text(5000,0).default(''),decisionType:z.enum(['minor_revision','major_revision','technical_correction','desk_reject','reject','accept']).optional(),internalNote:text(5000,0).optional(),revisionDeadline:date}),req);
  const {m,owner,editor}=await manuscriptAccess(req.user,req.params.id);
  const current=editorialOf(m), j=await Journal.findById(m.journal);
  if(b.status==='submitted') {
    if(!owner||!['draft','revision'].includes(current))fail(403,'Only the author can submit a draft or revision.');
    if(j.external||j.active===false)fail(409,'Choose an active internal journal.');
    if(!m.currentVersion)fail(400,'Upload a manuscript before submitting.');
    if(!m.title||!m.abstract||!m.keywords||Object.values(m.declarations.toObject?.()||m.declarations).some(v=>!v))fail(400,'Complete manuscript metadata and declarations.');
    if(current==='revision') {
      const v=await Version.findOne({manuscript:m._id,number:m.currentVersion});
      const last=m.history.filter(h=>h.status==='revision').at(-1);
      if(!v||!v.response||v.createdAt<=last?.at)fail(400,'Upload a new revision with a point-by-point response.');
    }
    m.submittedAt=new Date();
  } else if(b.status==='withdrawn') {
    if(!owner||['accepted','rejected','withdrawn'].includes(current))fail(403,'This manuscript cannot be withdrawn.');
  } else {
    if(!editor||!hasRole(req.user,'editor'))fail(403,'Only an assigned Editor can make editorial decisions.');
    if(same(m.author,req.user._id))fail(403,'An author cannot make editorial decisions on their own manuscript.');
    const transitions={submitted:['screening','rejected','revision'],screening:['under_review','revision','rejected'],under_review:['revision','accepted','rejected']};
    if(!transitions[current]?.includes(b.status))fail(409,`Cannot move from ${current} to ${b.status}.`);
    if(['revision','accepted','rejected'].includes(b.status)&&b.note.length<10)fail(400,'Provide a decision letter of at least 10 characters.');
    if(b.status==='under_review') {
      const screening=m.screeningChecks.find(c=>c.version===m.currentVersion&&['scope','files','declarations','readability'].every(k=>c.checks?.[k]));
      if(!screening)fail(409,'Complete and save the screening checklist for this version.');
      if(!await Assignment.exists({manuscript:m._id,round:m.currentVersion,status:'accepted'}))fail(409,'A reviewer must accept before review begins.');
      if(j.reviewPolicy?.model==='double_blind'&&!await ManuscriptFile.exists({manuscript:m._id,version:m.currentVersion,kind:'blinded'}))fail(409,'Upload an anonymized review file for double-blind review.');
    }
    if(b.status==='accepted') {
      const required=j.reviewPolicy?.requiredReviews||1;
      const completed=await Assignment.countDocuments({manuscript:m._id,round:m.currentVersion,status:'completed'});
      if(completed<required)fail(409,`This journal requires ${required} completed reviews of the current version.`);
      m.acceptedVersion=m.currentVersion;m.acceptedBy=req.user._id;m.acceptedAt=new Date();
      m.handoff={by:req.user._id,at:new Date(),version:m.currentVersion};
      m.productionStatus='queued';m.publicationStatus='not_published';
      m.productionHistory.push({status:'queued',by:req.user._id,at:new Date(),note:'Accepted version handed to production.'});
    }
    if(['revision','accepted','rejected'].includes(b.status))m.decisions.push({type:b.decisionType||(b.status==='revision'?'major_revision':b.status==='accepted'?'accept':'reject'),letter:b.note,internalNote:b.internalNote,by:req.user._id,at:new Date(),version:m.currentVersion,revisionDeadline:b.revisionDeadline});
  }
  m.editorialStatus=b.status;
  m.status=b.status; // Kept solely for compatibility with older clients and history.
  m.history.push({status:b.status,note:b.note,by:req.user._id});
  await m.save();await audit(req.user,`manuscript.${b.status}`,'Manuscript',m._id);
  await notify(m.author,`Manuscript ${b.status.replaceAll('_',' ')}`,`${m.code}: ${m.title}\n${b.note}`,`/manuscripts/${m._id}`,'manuscript');
  if(b.status==='submitted')await journalNotice(m,['editor'],current==='revision'?'Revised manuscript submitted':'New manuscript submission',`${m.code}: ${m.title}`);
  if(b.status==='accepted')await journalNotice(m,['publisher'],'Accepted manuscript ready for production',`${m.code}: accepted version ${m.acceptedVersion}`);
  res.json(m);
}

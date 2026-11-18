import { Assignment, Audit, User, Journal } from '../models/index.js';
import { notify } from './notifications.js';
export const audit = (user, action, resource, resourceId) => Audit.create({actor:user._id||user,action,resource,resourceId:String(resourceId)});
export async function journalNotice(m, roles, title, body) {
  const j=await Journal.findById(m.journal);
  const recipients=await User.find({_id:{$in:j?.editors||[]},roles:{$in:roles},active:true});
  await Promise.all(recipients.map(u=>notify(u,title,body,`/manuscripts/${m._id}`,'manuscript')));
}
export async function expireInvitations(now=new Date()) {
  const expired=await Assignment.find({status:'invited',responseDue:{$lte:now}});
  for (const a of expired) {
    const result=await Assignment.updateOne({_id:a._id,status:'invited'},{$set:{status:'expired'},$push:{events:{action:'expired',at:now}}});
    if(result.modifiedCount) await notify(a.editor,'Review invitation expired','Invite another eligible reviewer.',`/manuscripts/${a.manuscript}`,'review',`invitation-expired:${a._id}`);
  }
}

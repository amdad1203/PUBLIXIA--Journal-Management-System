import { Journal, Assignment } from '../models/index.js';
import { fail } from '../utils/http.js';
import { primaryRole, PRODUCTION_STATES } from '../../shared/workspaces.js';

export function selectedRole(req) {
  const role = req.query.workspace || primaryRole(req.user);
  if (typeof role !== 'string' || !req.user.roles.includes(role)) fail(403, 'This workspace is not assigned to your account.');
  return role;
}
export async function manuscriptScope(user, roles = user.roles) {
  if (roles.includes('admin')) return {};
  const scopes = [];
  if (roles.includes('researcher')) scopes.push({ author: user._id });
  if (roles.includes('reviewer')) scopes.push({ _id: { $in: await Assignment.find({ reviewer: user._id, status: { $in: ['invited', 'accepted', 'completed'] } }).distinct('manuscript') } });
  if (roles.some(role => ['editor', 'publisher'].includes(role))) {
    const journals = await Journal.find({ editors: user._id }).distinct('_id');
    if (roles.includes('editor')) scopes.push({ journal: { $in: journals }, status: { $ne: 'draft' } });
    if (roles.includes('publisher')) scopes.push({ journal: { $in: journals }, 'handoff.at':{$exists:true}, $or:[{editorialStatus:'accepted'},{status: { $in: PRODUCTION_STATES }}] });
  }
  return scopes.length ? { $or: scopes } : { _id: { $in: [] } };
}

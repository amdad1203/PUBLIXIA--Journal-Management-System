import { Journal, Manuscript, Assignment, Project, Audit } from "../models/index.js";
import { hasRole } from "../middleware/auth.js";
import { fail, id, same } from "../utils/http.js";
import { PRODUCTION_STATES } from '../../shared/workspaces.js';
export async function canEditJournal(user, journalId) {
  if (hasRole(user, "admin")) return true;
  if (!hasRole(user, "editor", "publisher")) return false;
  return !!(await Journal.exists({ _id: journalId, editors: user._id }));
}
export async function manuscriptAccess(user, manuscriptId, mode = "read") {
  id.parse(manuscriptId);
  const m = await Manuscript.findById(manuscriptId);
  if (!m) fail(404, "Manuscript not found.");
  const owner = hasRole(user, 'researcher') && same(m.author, user._id);
  const staff = await canEditJournal(user, m.journal);
  const editor = staff && hasRole(user, 'editor') && m.status !== 'draft' && !same(m.author,user._id);
  const production = staff && hasRole(user, 'publisher') && !!m.handoff?.at && (m.editorialStatus==='accepted'||PRODUCTION_STATES.includes(m.status));
  const assignment = hasRole(user, 'reviewer') ? await Assignment.findOne({
    manuscript: m._id,
    reviewer: user._id,
    status: { $in: ["invited", "accepted", "completed"] },
  }).sort({ round: -1 }) : null;
  if (
    mode === "owner"
      ? !owner
      : mode === "editor"
        ? !editor
        : !(owner || editor || production || assignment)
  )
    fail(403, "You cannot access this manuscript.");
  return { m, owner, editor, production, assignment };
}
export async function projectAccess(user, projectId, ownerOnly = false) {
  id.parse(projectId);
  const p = await Project.findById(projectId);
  if (!p) fail(404, "Project not found.");
  if(hasRole(user,'admin'))return p;
  if(!hasRole(user,'researcher'))fail(403,'Researcher project membership is required.');
  if(ownerOnly && !hasRole(user,'researcher'))fail(403,'Only the Researcher who owns the project can manage its settings.');
  if (
    !same(p.owner, user._id) &&
    (ownerOnly || !p.members.some((m) => same(m, user._id)))
  )
    fail(403, "You cannot access this project.");
  return p;
}

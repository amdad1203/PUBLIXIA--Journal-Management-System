// Account roles grant capabilities. A workspace selection never grants a new role.
export const ROLE_ORDER = ['admin', 'publisher', 'editor', 'reviewer', 'researcher'];
export const PRODUCTION_STATES = ['accepted', 'copyediting', 'typesetting', 'proofreading', 'published'];
export const WORKSPACES = {
  researcher: { label: 'Author / Researcher', title: 'Build your next contribution', description: 'Plan research, guide shared projects, organize evidence, write and respond to editorial feedback.', steps: ['Plan', 'Research', 'Write', 'Submit', 'Revise'], capabilities: ['research', 'projects', 'submit', 'supervise'] },
  reviewer: { label: 'Reviewer', title: 'Your independent review desk', description: 'Respond to invitations, evaluate assigned manuscripts and send confidential recommendations.', steps: ['Respond', 'Read', 'Evaluate', 'Submit report'], capabilities: ['review'] },
  editor: { label: 'Editor', title: 'Move submissions toward a decision', description: 'Screen your journal submissions, coordinate peer review and record editorial decisions.', steps: ['Screen', 'Invite', 'Assess reviews', 'Decide', 'Hand off'], capabilities: ['editorial', 'journals'] },
  publisher: { label: 'Publisher', title: 'Bring accepted research to publication', description: 'Manage production, assemble issues and publish accepted manuscripts for your journals.', steps: ['Copyedit', 'Typeset', 'Proofread', 'Assign issue', 'Publish'], capabilities: ['production', 'journals'] },
  admin: { label: 'Administrator', title: 'Platform operations and oversight', description: 'Manage people, journal staffing, AI criteria, notification delivery and audit records.', steps: ['Manage access', 'Configure', 'Monitor', 'Audit'], capabilities: ['administration', 'journals', 'oversight'] },
};
export const primaryRole = (user) => ROLE_ORDER.find(role => user?.roles?.includes(role)) || 'researcher';
export const can = (user, capability) => user?.roles?.some(role => WORKSPACES[role]?.capabilities.includes(capability)) || false;
export const workspaceUser = (user, role) => ({ ...user, roles: [role] });
export const editorialOf = m => m.editorialStatus || (PRODUCTION_STATES.includes(m.status) ? 'accepted' : m.status);
export const productionOf = m => m.productionStatus || ({accepted:'not_started',copyediting:'copyediting',typesetting:'typesetting',proofreading:'proof_preparation',published:'published'}[m.status] || 'not_started');
export const publicationOf = m => m.publicationStatus || (m.status === 'published' ? 'published' : 'not_published');
export function canVisit(role, pathname) {
  const matches = prefix => pathname === prefix || pathname.startsWith(prefix + '/');
  if (['/dashboard', '/settings', '/notifications', '/activity', '/guide', '/journals'].some(matches)) return true;
  const routes = {
    researcher: ['/projects', '/plan', '/research', '/studio', '/ai', '/screening', '/manuscripts', '/opportunities', '/conferences', '/academy', '/discover', '/author-sources', '/author-handbook', '/tools', '/collaboration'],
    reviewer: ['/reviews', '/manuscripts'],
    editor: ['/editorial', '/manuscripts', '/journal-management'],
    publisher: ['/production', '/issues', '/manuscripts', '/journal-management'],
    admin: ['/admin', '/journal-management', '/manuscripts', '/projects'],
  };
  return (routes[role] || []).some(matches);
}

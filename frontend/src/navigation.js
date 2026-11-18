export const navigation = {
  researcher: [
    ['WORKSPACE', [['/dashboard','Overview','LayoutDashboard'],['/projects','Research Planner','FolderKanban'],['/research','Research Library','FlaskConical'],['/studio','Writing Studio','PenTool']]],
    ['PUBLISH', [['/journals','Journal Directory','BookOpen'],['/manuscripts','My Manuscripts','FileText']]],
    ['ACCOUNT',[['/settings','Profile & Settings','Settings']]],
  ],
  reviewer: [
    ['WORKSPACE',[['/dashboard','Overview','LayoutDashboard'],['/reviews/invitations','Review Invitations','Mail'],['/reviews','My Reviews','ClipboardCheck'],['/reviews/history','Review History','History']]],
    ['ACCOUNT',[['/settings','Profile & Settings','Settings']]],
  ],
  editor: [
    ['WORKSPACE',[['/dashboard','Overview','LayoutDashboard'],['/editorial/submissions','Submission Queue','Inbox'],['/editorial/assignments','Reviewer Assignments','Users'],['/editorial/decisions','Decision Center','ClipboardCheck'],['/journal-management','Assigned Journals','BookOpen']]],
    ['ACCOUNT',[['/settings','Profile & Settings','Settings']]],
  ],
  publisher: [
    ['WORKSPACE',[['/dashboard','Overview','LayoutDashboard'],['/production','Production Queue','Layers'],['/production/proofs','Author Proofs','ClipboardCheck'],['/production/published','Published Articles','BookOpen']]],
    ['ACCOUNT',[['/settings','Profile & Settings','Settings']]],
  ],
  admin: [
    ['PLATFORM',[['/dashboard','Dashboard','LayoutDashboard'],['/admin/users','User & Role Management','Users'],['/journal-management','Journal Management','BookOpen'],['/admin/system','Audit & System Settings','ShieldCheck']]],
    ['ACCOUNT',[['/settings','Profile & Settings','Settings']]],
  ],
};

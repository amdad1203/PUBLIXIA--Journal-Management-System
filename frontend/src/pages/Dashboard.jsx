import ServiceHealth from './ServiceHealth';
import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,ArrowRight,Clock,CheckCircle2} from 'lucide-react';
import {useApp,useLoad} from '../context';
import {Load,Section,Status,Empty,Progress} from '../components';
import {dateLabel,label} from '../api';
import {WORKSPACES,editorialOf,productionOf} from '../../../shared/workspaces';
const actions={
 researcher:[['Research Planner','Plan a study or guide a shared project.','/projects'],['Writing Studio','Develop your manuscript and supporting evidence.','/studio'],['My Manuscripts','Submit, revise and respond to author proofs.','/manuscripts']],
 reviewer:[['Review Invitations','Check conflicts and respond to the editor.','/reviews/invitations'],['My Reviews','Resume an assessment and submit your report.','/reviews'],['Review History','Inspect your completed evaluations.','/reviews/history']],
 editor:[['Submission Queue','Check completeness and scope.','/editorial/submissions'],['Reviewer Assignments','Invite reviewers and track deadlines.','/editorial/assignments'],['Decision Center','Compare reports and issue your decision.','/editorial/decisions']],
 publisher:[['Production Queue','Work from the accepted, handed-off version.','/production'],['Author Proofs','Send proofs and resolve author corrections.','/production/proofs'],['Published Articles','Inspect the public publication record.','/production/published']],
 admin:[['User & Role Management','Manage access and account status.','/admin/users'],['Journal Management','Configure policies and assign journal staff.','/journal-management'],['Audit & System Settings','Inspect delivery, integrations and audit records.','/admin/system']],
};
export default function Dashboard(){
 const {user,workspaceRole:role}=useApp(),w=WORKSPACES[role];
 const {data:d,error}=useLoad(role==='admin'?'/admin/overview':`/dashboard?workspace=${role}`);
 const {data:assignments}=useLoad(role==='editor'?'/editorial/assignments':null);
 const {data:editorData}=useLoad(role==='editor'?'/operations/editor':null);
 const {data:productionData}=useLoad(role==='publisher'?'/operations/publisher':null);
 const ms=role==='publisher'?(productionData?.records.filter(m=>m.stage!=='published')||[]):d?.manuscripts||[],reviews=d?.assignments||[],projects=d?.projects||[],tasks=d?.tasks||[];
 const count=s=>ms.filter(m=>editorialOf(m)===s).length;
 const metrics=role==='researcher'?[['Research projects',projects.length],['Working drafts',count('draft')],['In editorial review',count('submitted')+count('screening')+count('under_review')],['Revisions requested',count('revision')]]:
 role==='reviewer'?[['Pending invitations',reviews.filter(a=>a.status==='invited').length],['Active reviews',reviews.filter(a=>a.status==='accepted').length],['Due soon',reviews.filter(a=>a.status==='accepted'&&new Date(a.due)<new Date(Date.now()+7*86400000)).length],['Completed reviews',reviews.filter(a=>a.status==='completed').length]]:
 role==='editor'?[['New submissions',editorData?.stats.submitted??0],['Under review',editorData?.stats.underReview??0],['Reviews completed',editorData?.stats.completed??0],['Decisions pending',editorData?.stats.decisionPending??0]]:
 role==='publisher'?[['Waiting for production',productionData?.counts.waiting||0],['In production',productionData?.counts.in_production||0],['Awaiting author',productionData?.counts.awaiting||0],['Ready to publish',productionData?.counts.ready||0]]:
 Object.entries(d?.counts||{}).map(([k,v])=>[label(k),v]);
 return <div className={`role-workspace role-${role}`}>
  <section className="workspace-hero"><div><span className="workspace-eyebrow">{w.label.toUpperCase()} WORKSPACE</span><h1>{w.title}</h1><p>{w.description}</p><Link className="btn" to={actions[role][0][2]}>{role==='editor'?'Open Submission Queue':actions[role][0][0]}<ArrowRight size={17}/></Link></div><div className="workspace-process"><small>YOUR PART IN THE WORKFLOW</small>{w.steps.map((step,i)=><div key={step}><span>{String(i+1).padStart(2,'0')}</span>{step}</div>)}</div></section>
  <Load data={d} error={error}>{d&&<>
   <div className="stats-grid role-stats">{metrics.map(([name,value],i)=>['editor','admin','publisher'].includes(role)?<Link className="stat-card" key={name} to={role==='publisher'?`/production?stage=${['waiting','in_production','awaiting','ready'][i]}`:role==='editor'?['/editorial/submissions?status=submitted','/editorial/submissions?status=under_review','/editorial/assignments','/editorial/decisions?status=under_review'][i]:name.toLowerCase().includes('journal')?'/journal-management':name.toLowerCase().includes('user')?'/admin/users':'/admin/system'}><small>{name}</small><strong className="stat-number">{value}</strong></Link>:<div className="stat-card" key={name}><small>{name}</small><strong className="stat-number">{value}</strong></div>)}</div>
   <div className="role-actions">{actions[role].map(([title,description,url])=><Link className="panel role-action" to={url} key={url}><ArrowUpRight size={21}/><h3>{title}</h3><p>{description}</p></Link>)}</div>
   <div className="dashboard-grid"><div className="dashboard-main">
    {role==='researcher'&&<Section title="Research in progress" link="/projects">{projects.slice(0,4).map(p=><Link className="workspace-record" to={`/projects/${p._id}`} key={p._id}><div><small>{p.owner===user.id?'My project':'Shared project'}</small><h3>{p.title}</h3><Progress value={p.taskCount?p.completedTasks/p.taskCount*100:0}/><small>{p.completedTasks} / {p.taskCount} tasks completed</small></div><ArrowUpRight size={18}/></Link>)}{!projects.length&&<Empty title="Start your research plan" text="Your owned and shared projects will appear here."/>}</Section>}
    {role==='reviewer'?<Section title="Your next reviews" link="/reviews">{reviews.filter(a=>['invited','accepted'].includes(a.status)).slice(0,8).map(a=><Link className="workspace-record" to={a.status==='invited'?'/reviews/invitations':`/manuscripts/${a.manuscript?._id}?tab=Peer%20review`} key={a._id}><div><small>{a.manuscript?.code} · Due {dateLabel(a.due)}</small><h3>{a.manuscript?.title||'Assignment no longer available'}</h3></div><Status value={a.status}/></Link>)}{!reviews.some(a=>['invited','accepted'].includes(a.status))&&<Empty title="No open reviews" text="New invitations from an editor will appear here."/>}</Section>:
     role==='admin'?<Section title="Recent administrative activity" link="/activity">{d.audit.map(a=><div className="workspace-record" key={a._id}><div><h3>{label(a.action)}</h3><small>{a.actor?.name} · {dateLabel(a.createdAt)}</small></div><span>{a.resource}</span></div>)}</Section>:
     <Section title={role==='researcher'?'Manuscript progress':role==='editor'?'Editorial work queue':'Production work queue'} link={role==='researcher'?'/manuscripts':role==='editor'?'/editorial/submissions':'/production'}>{ms.slice(0,7).map(m=><Link className="workspace-record" key={m._id} to={`/manuscripts/${m._id}`}><div><small>{m.code} · {m.journal?.name}{role==='publisher'&&` · Updated ${dateLabel(m.updatedAt)}`}</small><h3>{m.title}</h3></div><Status value={role==='publisher'?productionOf(m):editorialOf(m)}/></Link>)}{!ms.length&&<Empty title="Your queue is clear" text="Records appear when the preceding workflow step is completed."/>}</Section>}
    {role==='editor'&&editorData&&<><Section title="Recent reviewer assignments" link="/editorial/assignments">{editorData.assignments.slice(0,5).map(a=><div className="workspace-record" key={a._id}><div><b>{a.reviewer?.name}</b><p>{editorData.manuscripts.find(m=>m._id===a.manuscript)?.title}</p><small>Due {dateLabel(a.due)}</small></div><Status value={a.status}/></div>)}</Section><Section title="Decision-ready manuscripts" link="/editorial/decisions">{editorData.manuscripts.filter(m=>editorialOf(m)==='under_review'&&m.completedReviews>0).slice(0,5).map(m=><Link className="workspace-record" key={m._id} to={`/manuscripts/${m._id}?tab=Peer%20review`}><div><b>{m.title}</b><small>{m.journal?.name}</small><p>{m.completedReviews} completed · {m.pendingReviews} pending</p></div></Link>)}</Section><Section title="Recent editorial activity">{editorData.activity.map(a=><div className="list-row" key={a._id}><b>{label(a.action)}</b><small>{a.actor?.name||'System'} · {dateLabel(a.createdAt)}</small></div>)}</Section></>}
   </div><aside className="dashboard-side">
    <Section title={role==='admin'?'Connected services':'Latest notifications'} link={role==='admin'?'/admin/system':'/notifications'}>{role==='admin'?<ServiceHealth/>:d.notifications.map(n=><Link className="workspace-notice" key={n._id} to={n.link||'/notifications'}><b>{n.title}</b><small>{dateLabel(n.createdAt)}</small><p>{n.body}</p></Link>)}</Section>
    {role==='researcher'&&<Section title="Next project tasks">{tasks.filter(t=>t.status!=='done').slice(0,5).map(t=><Link className="list-row" key={t._id} to={`/projects/${t.project}`}><Clock size={16}/><span>{t.title}<small>{dateLabel(t.due)}</small></span></Link>)}</Section>}
    <div className="panel workspace-responsibility"><small>WORKSPACE RESPONSIBILITY</small><p>{w.description}</p><Link to="/settings">Profile, notifications & activity <ArrowUpRight size={15}/></Link></div>
   </aside></div>
  </>}</Load>
 </div>;
}

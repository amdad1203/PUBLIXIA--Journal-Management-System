import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (name, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: name,
  required,
});
const make = (name, fields, indexes = []) => {
  const s = new Schema(fields, {
    timestamps: true,
    optimisticConcurrency: true,
    suppressReservedKeysWarning: true,
  });
  indexes.forEach((i) => s.index(...i));
  return mongoose.model(name, s);
};
export const roles = [
  "researcher",


  "reviewer",
  "editor",
  "publisher",

  "admin",
];
export const User = make("User", {
  academicStatus: {type:String,enum:['undergraduate','postgraduate','independent_researcher','faculty','academic_author','other'],default:'independent_researcher'},
  activeProject: ref('Project'),
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  roles: { type: [String], enum: roles, default: ["researcher"] },
  affiliation: String,
  bio: String,
  interests: String,
  reviewerAvailable: {type:Boolean,default:true},
  reviewerCapacity: {type:Number,default:3},
  emailNotifications: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },
  demo: { type: Boolean, default: false },
});
export const AuthToken = make(
  "AuthToken",
  {
    user: ref("User", true),
    hash: { type: String, unique: true },
    kind: { type: String, enum: ["verify", "reset"] },
    expiresAt: Date,
  },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const Journal = make("Journal", {
  active: {type:Boolean,default:true},
  reviewPolicy: {
    requiredReviews: {type:Number,min:1,max:10,default:1},
    model: {type:String,enum:['single_blind','double_blind','open'],default:'single_blind'},
  },
  external: Boolean,
  sourceUrl: String,
  sourceCheckedAt: Date,
  sourceDetails: Schema.Types.Mixed,
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  subject: String,
  description: String,
  frequency: String,
  issn: String,
  guidelines: String,
  editors: [ref("User")],
  synthetic: { type: Boolean, default: false },
});
export const manuscriptStates = [
  "draft",
  "submitted",
  "screening",
  "under_review",
  "revision",
  "accepted",
  "copyediting",
  "typesetting",
  "proofreading",
  "published",
  "rejected",
  "withdrawn",
];
export const Manuscript = make(
  "Manuscript",
  {
    code: { type: String, unique: true },
    title: { type: String, required: true },
    abstract: String,
    keywords: String,
    journal: ref("Journal", true),
    author: ref("User", true),
    coauthors: String,
    declarations: {
      ethics: String,
      consent: String,
      conflicts: String,
      funding: String,
      data: String,
      ai: String,
      contributions: String,
    },
    status: { type: String, enum: manuscriptStates, default: "draft" },
    editorialStatus: {type:String,enum:['draft','submitted','screening','under_review','revision','accepted','rejected','withdrawn']},
    productionStatus: {type:String,enum:['not_started','queued','copyediting','typesetting','proof_preparation','proof_sent','corrections_pending','approved','published']},
    publicationStatus: {type:String,enum:['not_published','published']},
    submittedAt: Date,
    acceptedVersion: Number,
    acceptedBy: ref('User'),
    acceptedAt: Date,
    handoff: {by:ref('User'),at:Date,version:Number},
    decisions: [{type:{type:String},letter:String,internalNote:String,by:ref('User'),at:Date,version:Number,revisionDeadline:Date}],
    screeningChecks: [{by:ref('User'),at:Date,version:Number,checks:Schema.Types.Mixed,note:String}],
    productionHistory: [{status:String,note:String,by:ref('User'),at:Date,file:ref('ManuscriptFile')}],
    qualityCheck: {by:ref('User'),at:Date,file:ref('ManuscriptFile'),checks:Schema.Types.Mixed},
    doiStatus: {type:String,enum:['pending','provided','registered'],default:'pending'},
    currentVersion: { type: Number, default: 0 },
    history: [
      {
        status: String,
        note: String,
        by: ref("User"),
        at: { type: Date, default: Date.now },
      },
    ],
    publishedAt: Date,
    issue: ref("Issue"),
    doi: String,
    synthetic: Boolean,
  },
  [[{ author: 1, updatedAt: -1 }], [{ journal: 1, status: 1 }]],
);
export const Version = make(
  "Version",
  {
    manuscript: ref("Manuscript", true),
    number: Number,
    filename: String,
    path: String,
    mime: String,
    size: Number,
    text: String,
    response: String,
    kind: { type: String, default: "upload" },
  },
  [[{ manuscript: 1, number: 1 }, { unique: true }]],
);
export const Assignment = make(
  "Assignment",
  {
    manuscript: ref("Manuscript", true),
    reviewer: ref("User", true),
    editor: ref("User", true),
    due: Date,
    responseDue: Date,
    respondedAt: Date,
    conflictDeclared: Boolean,
    responseReason: String,
    invitationMessage: String,
    draft: Schema.Types.Mixed,
    draftHistory: [{data:Schema.Types.Mixed,at:Date,by:ref('User')}],
    submittedAt: Date,
    events: [{action:String,note:String,by:ref('User'),at:Date}],
    round: Number,
    status: {
      type: String,
      enum: ["invited", "accepted", "declined", "completed", "expired", "cancelled"],
      default: "invited",
    },
  },
  [[{ manuscript: 1, reviewer: 1, round: 1 }, { unique: true }]],
);
export const Review = make("Review", {
  assignment: { ...ref("Assignment", true), unique: true },
  manuscript: ref("Manuscript", true),
  reviewer: ref("User", true),
  recommendation: {
    type: String,
    enum: ["accept", "minor_revision", "major_revision", "reject"],
  },
  scores: {
    originality: Number,
    methodology: Number,
    results: Number,
    presentation: Number,
  },
  authorComments: String,
  confidentialComments: String,
});
export const ManuscriptFile = make('ManuscriptFile', {
  manuscript:ref('Manuscript',true),version:Number,kind:{type:String,enum:['blinded','supplement','production','proof']},
  filename:String,path:String,mime:String,size:Number,text:String,uploadedBy:ref('User'),
  state:{type:String,enum:['uploaded','sent','corrections_pending','approved'],default:'uploaded'},
  sentAt:Date,responses:[{decision:String,note:String,by:ref('User'),at:Date}],
});
export const Issue = make(
  "Issue",
  {
    journal: ref("Journal", true),
    volume: Number,
    number: Number,
    title: String,
    publishedAt: Date,
  },
  [[{ journal: 1, volume: 1, number: 1 }, { unique: true }]],
);
export const Screening = make("Screening", {
  criteriaSnapshot: Schema.Types.Mixed,
  researchContext: Schema.Types.Mixed,
  manuscript: ref("Manuscript", true),
  version: ref("Version", true),
  owner: ref("User", true),
  mode: String,
  summary: String,
  model: String,
  analyzedCharacters: Number,
  totalCharacters: Number,
  issues: [
    {
      category: String,
      original: String,
      replacement: String,
      explanation: String,
      decision: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
    },
  ],
});
export const Project = make(
  "Project",
  {
    plan: Schema.Types.Mixed,
    owner: ref("User", true),
    title: { type: String, required: true },
    description: String,
    domain: String,
    objectives: String,
    due: Date,
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
    members: [ref("User")],
    feedback: [
      { by: ref("User"), text: String, at: { type: Date, default: Date.now } },
    ],
    synthetic: Boolean,
  },
  [[{ owner: 1, updatedAt: -1 }]],
);
export const Task = make(
  "Task",
  {
    assignee: ref('User'),
    project: ref("Project", true),
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    due: Date,
    milestone: { type: Boolean, default: false },
  },
  [[{ project: 1, due: 1 }]],
);
export const Paper = make(
  "Paper",
  {
    owner: ref("User", true),
    title: String,
    authors: String,
    year: Number,
    doi: String,
    url: String,
    abstract: String,
    source: String,
    notes: String,
    methodology: String,
    findings: String,
    limitations: String,
    collection: String,
    synthetic: Boolean,
  },
  [
    [
      { owner: 1, doi: 1 },
      { unique: true, partialFilterExpression: { doi: { $type: "string" } } },
    ],
  ],
);
export const Conversation = make(
  "Conversation",
  {
    owner: ref("User", true),
    title: String,
    assistant: String,
    messages: [
      {
        role: { type: String, enum: ["user", "model"] },
        text: String,
          sourceIds: [ref("Paper")],
        at: { type: Date, default: Date.now },
      },
    ],
  },
  [[{ owner: 1, updatedAt: -1 }]],
);
export const AIUsage = make("AIUsage", {
  owner: ref("User"),
  feature: String,
  model: String,
  tokens: Number,
  success: Boolean,
  code: String,
});
export const Course = make("Course", {
  title: String,
  category: String,
  description: String,
  level: String,
  duration: String,
  lessons: [
    {
      title: String,
      content: String,
      exercise: String,
      quiz: { question: String, options: [String], answer: Number },
    },
  ],
  synthetic: Boolean,
});
export const Enrollment = make(
  "Enrollment",
  {
    owner: ref("User", true),
    course: ref("Course", true),
    completed: [Number],
    attempts: [
      {
        lesson: Number,
        answer: Number,
        correct: Boolean,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  [[{ owner: 1, course: 1 }, { unique: true }]],
);
export const Conference = make("Conference", {
  retrievedAt: Date,
  title: String,
  domain: String,
  country: String,
  city: String,
  organizer: String,
  date: Date,
  deadline: Date,
  description: String,
  url: String,
  verification: String,
  source: String,
  synthetic: Boolean,
});
export const Bookmark = make(
  "Bookmark",
  {
    owner: ref("User", true),
    conference: ref("Conference", true),
    status: {
      type: String,
      enum: ["saved", "preparing", "submitted", "accepted", "rejected"],
      default: "saved",
    },
    budget: { type: Number, default: 0 },
  },
  [[{ owner: 1, conference: 1 }, { unique: true }]],
);
export const Opportunity = make("Opportunity", {
  title: String,
  type: String,
  description: String,
  eligibility: String,
  funding: String,
  deadline: Date,
  url: String,
  verification: String,
  synthetic: Boolean,
});
export const Application = make(
  "Application",
  {
    owner: ref("User", true),
    opportunity: ref("Opportunity", true),
    status: {
      type: String,
      enum: ["saved", "preparing", "submitted", "successful", "unsuccessful"],
      default: "saved",
    },
    notes: String,
  },
  [[{ owner: 1, opportunity: 1 }, { unique: true }]],
);
export const Document = make("Document", {
  workspace: Schema.Types.Mixed,
  owner: ref("User", true),
  title: String,
  type: {
    type: String,
    enum: [
      "paper",
      "abstract",
      "proposal",
      "presentation",
      "poster",
      "questionnaire",
    ],
  },
  content: String,
});
export const Notification = make(
  "Notification",
  {
    user: ref("User", true),
    eventKey: { type: String, unique: true },
    category: String,
    title: String,
    body: String,
    link: String,
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    email: {
      state: {
        type: String,
        enum: ["pending", "processing", "sent", "failed", "skipped"],
        default: "pending",
      },
      attempts: { type: Number, default: 0 },
      nextAttempt: { type: Date, default: Date.now },
      leaseUntil: Date,
      leaseToken: String,
      sentAt: Date,
      lastError: String,
      messageId: String,
    },
  },
  [
    [{ user: 1, createdAt: -1 }],
    [{ "email.state": 1, "email.nextAttempt": 1 }],
  ],
);
export const Audit = make("Audit", {
  details: Schema.Types.Mixed,
  actor: ref("User"),
  action: String,
  resource: String,
  resourceId: String,
});

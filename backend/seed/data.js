import bcrypt from "bcryptjs";
import * as M from "../models/index.js";
import { notify } from "../services/notifications.js";
const domains = [
  "Computer Vision",
  "Cybersecurity",
  "Machine Learning",
  "Remote Sensing",
  "Internet of Things",
  "Robotics",
  "Telecommunications",
  "Data Science",
  "Information Systems",
  "Environmental Engineering",
  "Public Health",
  "Education",
];
const topics = [
  "Flood risk mapping with satellite observations",
  "Privacy-preserving learning across institutions",
  "Low-cost air quality sensor calibration",
  "Interpretable models for crop disease detection",
  "Accessible digital learning in rural communities",
  "Energy-aware routing for sensor networks",
  "Robust visual navigation under uncertainty",
  "Reproducible evaluation of clinical prediction models",
  "Community participation in climate adaptation",
  "Secure authentication for connected devices",
  "Measuring bias in educational datasets",
  "Open data practices in university research",
];
const names = [
  "Amina Rahman",
  "Farhan Ahmed",
  "Nusrat Jahan",
  "Tanvir Hasan",
  "Meherun Nisa",
  "Rafiul Islam",
  "Sadika Chowdhury",
  "Arif Hossain",
  "Nabila Sultana",
  "Samiul Karim",
];
const later = (days) => new Date(Date.now() + days * 86400000);
export async function seed({
  password = process.env.DEMO_PASSWORD,
  small = false,
} = {}) {
  if (!password || password.length < 5)
    throw new Error(
      "Set DEMO_PASSWORD to at least 5 characters before seeding.",
    );
  const hash = await bcrypt.hash(password, 12);
  const users = [];
  const main = [
    "admin",
    "editor",
    "reviewer",
    "author",
    "researcher",
    "student",
    "supervisor",
    "publisher",
    "instructor",
  ];
  for (let i = 0; i < (small ? 9 : 40); i++) {
    const role = main[i] || "researcher";
    const email = `${main[i] || `researcher${i}`}@demo.publixia.test`;
    users.push(
      await M.User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name:
              i < main.length
                ? `${role[0].toUpperCase() + role.slice(1)} Demo`
                : names[i % names.length],
            email,
            passwordHash: hash,
            roles: [...new Set([["author","student","instructor"].includes(role)?"researcher":role, "researcher"])],
            affiliation: [
              "Dhaka Research Institute (Demo)",
              "Coastal Science University (Demo)",
              "Open Knowledge Lab (Demo)",
            ][i % 3],
            interests: domains[i % domains.length],
            bio: "Synthetic profile for the Publixia demonstration.",
            emailVerified: true,
            demo: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      ),
    );
  }
  const journals = [];
  for (let i = 0; i < (small ? 2 : 12); i++)
    journals.push(
      await M.Journal.findOneAndUpdate(
        { slug: `demo-${i}` },
        {
          $setOnInsert: {
            name: `Journal of ${domains[i]} Research`,
            subject: domains[i],
            description: `An illustrative open-access journal for reproducible work in ${domains[i].toLowerCase()}. All publication records in this demonstration are synthetic.`,
            frequency: "Quarterly",
            issn: "Demo · not registered",
            guidelines:
              "Include a structured abstract, introduction, methods, results, discussion, limitations and references. Disclose ethics approval, conflicts, funding, data availability and AI assistance. Use consistent references. Human editors make all publication decisions.",
            editors: [users[1]._id, users[7]._id],
            synthetic: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      ),
    );
  const issues = [];
  for (const journal of journals)
    issues.push(
      await M.Issue.findOneAndUpdate(
        { journal: journal._id, volume: 1, number: 1 },
        {
          $setOnInsert: {
            title: "Demonstration issue · research in practice",
            publishedAt: new Date(),
          },
        },
        { returnDocument: "after", upsert: true },
      ),
    );
  for (let i = 0; i < (small ? 3 : 80); i++) {
    const code = `PX-DEMO-${String(i + 1).padStart(4, "0")}`;
    if (await M.Manuscript.exists({ code })) continue;
    const status =
      i < 60 && !small
        ? "published"
        : [
            "draft",
            "submitted",
            "screening",
            "under_review",
            "revision",
            "accepted",
            "copyediting",
            "typesetting",
            "proofreading",
          ][i % 9];
    const j = i % journals.length;
    const title = `${topics[i % topics.length]}: ${["a pilot study", "a reproducibility framework", "a comparative analysis", "a mixed-methods protocol", "an evaluation study", "a regional perspective", "a practical review"][Math.floor(i / topics.length) % 7]}`;
    const abstract = `This synthetic manuscript explores ${topics[i % topics.length].toLowerCase()}. It demonstrates a transparent research workflow, including study design, evaluation criteria and limitations. All descriptions are illustrative; they do not represent collected data or actual research findings. The example emphasizes reproducibility, documented assumptions and responsible interpretation.`;
    const m = await M.Manuscript.create({
      code,
      title,
      abstract,
      keywords: domains[j],
      journal: journals[j]._id,
      author: users[3]._id,
      coauthors: names[(i + 1) % names.length],
      status,
      currentVersion: 1,
      synthetic: true,
      issue: status === "published" ? issues[j]._id : undefined,
      publishedAt: status === "published" ? new Date() : undefined,
      declarations: {
        ethics: "Synthetic demonstration; no participants.",
        consent: "Not applicable.",
        conflicts: "None declared in this demonstration.",
        funding: "No external funding.",
        data: "No actual dataset.",
        ai: "Illustrative content generated for software testing.",
        contributions: "Demonstration writing and review.",
      },
      history: [
        { status, note: "Synthetic demonstration record", by: users[1]._id },
      ],
    });
    await M.Version.create({
      manuscript: m._id,
      number: 1,
      filename: `${code}.docx`,
      text: `${title}\n\nAbstract\n${abstract}\n\nIntroduction\n${topics[i % topics.length]} presents a useful setting for examining research design. This example is synthetic.\n\nMethods\nWe propose a reproducible protocol, document assumptions and identify appropriate comparison conditions. No real experiment was performed.\n\nResults\nNo empirical findings are claimed. This section demonstrates document structure.\n\nDiscussion\nResearchers should verify sources, evaluate limitations and obtain appropriate approvals before collecting data.\n\nLimitations\nThis is demonstration content and cannot support scientific conclusions.\n\nReferences\nAdd independently verified sources before any real submission.`,
      kind: "synthetic",
    });
    if (
      [
        "under_review",
        "revision",
        "accepted",
        "copyediting",
        "typesetting",
        "proofreading",
        "published",
      ].includes(status)
    ) {
      const done = status !== "under_review";
      const a = await M.Assignment.create({
        manuscript: m._id,
        reviewer: users[2]._id,
        editor: users[1]._id,
        round: 1,
        status: done ? "completed" : "accepted",
        due: later(14),
      });
      if (done)
        await M.Review.create({
          assignment: a._id,
          manuscript: m._id,
          reviewer: users[2]._id,
          recommendation: status === "revision" ? "major_revision" : "accept",
          scores: {
            originality: 3,
            methodology: 4,
            results: 3,
            presentation: 4,
          },
          authorComments:
            "Synthetic peer review: improve the explanation of sampling assumptions and add a clear limitations section. No scientific validity is implied.",
          confidentialComments: "Demonstration confidential editorial comment.",
        });
    }
  }
  for (let i = 0; i < (small ? 2 : 30); i++) {
    const title = `${topics[i % topics.length]} · ${i < 12 ? "Study design" : i < 24 ? "Evidence review" : "Validation phase"}`;
    const owner = i % 3 === 0 ? users[3] : users[4];
    const p = await M.Project.findOneAndUpdate(
      { owner: owner._id, title },
      {
        $setOnInsert: {
          description:
            "A synthetic research workspace with real, persistent tasks and collaborative feedback.",
          domain: domains[i % domains.length],
          objectives:
            "Formulate an answerable question, review sources, design the study and document limitations.",
          due: later(30 + i * 2),
          members: [
            users[6]._id,
            ...(owner === users[3] ? [users[4]._id] : []),
          ],
          synthetic: true,
        },
      },
      { returnDocument: "after", upsert: true },
    );
    for (let t = 0; t < 10; t++) {
      const title = [
        "Define research question",
        "Build search strategy",
        "Screen candidate studies",
        "Complete literature matrix",
        "Choose evaluation methods",
        "Prepare ethics documents",
        "Validate analysis workflow",
        "Draft methods section",
        "Review with supervisor",
        "Prepare journal submission",
      ][t];
      await M.Task.findOneAndUpdate(
        { project: p._id, title },
        {
          $setOnInsert: {
            status: ["done", "in_progress", "todo", "review"][(i + t) % 4],
            priority: t % 3 === 0 ? "high" : "medium",
            due: later(2 + t + i),
            milestone: t % 3 === 0,
          },
        },
        { upsert: true },
      );
    }
  }
  for (let i = 0; i < (small ? 4 : 150); i++) {
    const owner = i % 2 === 0 ? users[4] : users[3];
    const title = `${topics[i % topics.length]} — illustrative evidence record ${Math.floor(i / topics.length) + 1}`;
    await M.Paper.findOneAndUpdate(
      { owner: owner._id, title },
      {
        $setOnInsert: {
          authors: names[i % names.length],
          year: 2022 + (i % 5),
          source: "Synthetic demonstration",
          abstract:
            "An illustrative literature entry. This is not a real publication and has no registered DOI.",
          notes:
            "Replace with verified literature from the discovery search before using this in research.",
          methodology: [
            "Scoping review",
            "Observational protocol",
            "Simulation study",
          ][i % 3],
          findings: "No empirical findings; demonstration only.",
          limitations: "Synthetic metadata is unsuitable as research evidence.",
          collection: domains[i % domains.length],
          synthetic: true,
        },
      },
      { upsert: true },
    );
  }
  const courseTitles = [
    "Foundations of academic research",
    "Finding a research question",
    "Mapping the literature",
    "Building an evidence matrix",
    "Research design and methodology",
    "Responsible data collection",
    "Reproducible data analysis",
    "Writing a research paper",
    "Citations and source verification",
    "Choosing a journal",
    "Understanding peer review",
    "Presenting your research",
  ];
  const lessonNames = [
    "Understand the purpose",
    "Choose a workable approach",
    "Document your decisions",
    "Evaluate limitations",
    "Apply what you learned",
  ];
  for (let i = 0; i < (small ? 2 : 12); i++)
    await M.Course.findOneAndUpdate(
      { title: courseTitles[i] },
      {
        $setOnInsert: {
          category: domains[i % domains.length],
          description: `A practical introductory pathway to ${courseTitles[i].toLowerCase()}, with short readings, exercises and knowledge checks.`,
          level: i < 4 ? "Beginner" : "Intermediate",
          duration: "45–60 min",
          synthetic: true,
          lessons: lessonNames.map((title, n) => ({
            title: `${title}: ${courseTitles[i].toLowerCase()}`,
            content: `${courseTitles[i]} begins with a clear purpose and explicit assumptions. Write down what you want to learn, why the question matters and which evidence could answer it.\n\nA useful workflow separates observations from interpretations. Keep a dated record of search terms, inclusion criteria, analytical choices and changes to the plan. Another researcher should be able to understand how you reached a conclusion.\n\nExample: a team studying access to online learning defines its target population and compares multiple sources before designing a survey. It records missing evidence instead of inventing an answer.\n\nFor this lesson, focus on ${["defining a specific objective", "matching a method to the question", "recording assumptions and decisions", "explaining uncertainty and bias", "connecting conclusions to evidence"][n]}. Review your work with a supervisor and use sources that you can independently verify.`,
            exercise: `Write three sentences about ${courseTitles[i].toLowerCase()} in your own project. Identify one assumption and how you would check it.`,
            quiz: {
              question:
                "Which practice makes research easier to assess and reproduce?",
              options: [
                "Hide changes to the original plan",
                "Document methods, assumptions and limitations",
                "Choose results that confirm your expectations",
              ],
              answer: 1,
            },
          })),
        },
      },
      { upsert: true },
    );
  for (let i = 0; i < (small ? 3 : 50); i++)
    await M.Conference.findOneAndUpdate(
      {
        title: `${domains[i % domains.length]} Research Forum ${2027 + Math.floor(i / 24)} · ${i + 1}`,
      },
      {
        $setOnInsert: {
          domain: domains[i % domains.length],
          country:
            i % 3 === 0
              ? "Bangladesh"
              : i % 3 === 1
                ? "Malaysia"
                : "United Kingdom",
          city: i % 3 === 0 ? "Dhaka" : i % 3 === 1 ? "Kuala Lumpur" : "London",
          organizer: "Illustrative Academic Network",
          date: later(60 + i * 4),
          deadline: later(14 + i * 3),
          description:
            "Synthetic conference for demonstrating discovery, bookmarking and submission tracking. Do not submit or make travel plans for this illustrative event.",
          verification: "Synthetic — not a real event",
          source: "Publixia demonstration dataset",
          synthetic: true,
        },
      },
      { upsert: true },
    );
  for (let i = 0; i < (small ? 3 : 40); i++)
    await M.Opportunity.findOneAndUpdate(
      {
        title: `${domains[i % domains.length]} ${["Research Grant", "Fellowship", "Internship", "Scholarship"][i % 4]} · Demo ${i + 1}`,
      },
      {
        $setOnInsert: {
          type: ["Grant", "Fellowship", "Internship", "Scholarship"][i % 4],
          description:
            "Illustrative opportunity for testing the application tracker. No actual funding or position is offered.",
          eligibility:
            "Example eligibility: students and early-career researchers.",
          funding: "Illustrative funding only",
          deadline: later(20 + i * 2),
          verification: "Synthetic — not a real offer",
          synthetic: true,
        },
      },
      { upsert: true },
    );
  const learningCourses = await M.Course.find().sort({ createdAt: 1 }).limit(2);
  for (const learner of [users[4], users[5], users[8]])
    for (const course of learningCourses)
      await M.Enrollment.findOneAndUpdate(
        { owner: learner._id, course: course._id },
        {
          $setOnInsert: {
            completed: [0],
            attempts: [{ lesson: 0, answer: 1, correct: true }],
          },
        },
        { upsert: true },
      );
  const studentProject = await M.Project.findOne({ owner: users[4]._id });
  if (studentProject)
    await M.Project.updateOne(
      { _id: studentProject._id },
      { $addToSet: { members: users[5]._id } },
    );
  for (const u of users.slice(0, 9)) {
    await notify(
      u,
      "Welcome to your research workspace",
      "Explore the connected research, writing and publishing tools. This demo account uses synthetic records and does not send email.",
      "/dashboard",
      "system",
      `seed:welcome:${u._id}`,
    );
    await M.Notification.updateMany(
      { user: u._id },
      {
        $set: {
          "email.state": "skipped",
          "email.lastError": "Synthetic demo account; no email sent.",
        },
      },
    );
  }
  return {
    users: await M.User.countDocuments(),
    journals: await M.Journal.countDocuments(),
    manuscripts: await M.Manuscript.countDocuments(),
    projects: await M.Project.countDocuments(),
    papers: await M.Paper.countDocuments(),
    courses: await M.Course.countDocuments(),
  };
}

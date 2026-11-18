import { Task, Project, Bookmark } from "../models/index.js";
import { notify } from "../services/notifications.js";
import { expireInvitations } from '../services/lifecycle.js';
export async function createReminders(now = new Date()) {
  await expireInvitations(now);
  const next = new Date(now.getTime() + 86400000);
  for (const task of await Task.find({
    status: { $ne: "done" },
    due: { $gte: now, $lte: next },
  })) {
    const p = await Project.findById(task.project);
    if (p)
      await notify(
        p.owner,
        "Research deadline tomorrow",
        task.title,
        `/projects/${p._id}`,
        "deadline",
        `task:${task._id}:${task.due.toISOString()}`,
      );
  }
  const marks = await Bookmark.find().populate({
    path: "conference",
    match: { deadline: { $gte: now, $lte: next } },
  });
  for (const mark of marks)
    if (mark.conference)
      await notify(
        mark.owner,
        "Conference deadline tomorrow",
        mark.conference.title,
        "/conferences",
        "deadline",
        `conference:${mark.owner}:${mark.conference._id}:${mark.conference.deadline.toISOString()}`,
      );
}
export function startReminders() {
  let busy = false;
  const run = async () => {
    if (busy) return;
    busy = true;
    try {
      await createReminders();
    } catch {
      console.error("Deadline reminder scan will retry.");
    } finally {
      busy = false;
    }
  };
  run();
  const timer = setInterval(run, 60 * 60000);
  timer.unref();
  return () => clearInterval(timer);
}

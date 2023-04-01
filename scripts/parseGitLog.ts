import { Commit } from "./types";

export const parseGitLog = (gitLog: string): Commit[] => {
  const lines = gitLog.trim().split("\n");

  const commits: Commit[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("commit ")) {
      const date = new Date(lines[i + 2].substring(8));
      const msg = lines[i + 4].trim().split("\n")[0];

      commits.push({ date, msg });
    }
  }

  commits.sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueCommits: Commit[] = [];

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];

    if (!uniqueCommits.some((c) => c.msg === commit.msg)) {
      uniqueCommits.push(commit);
    }
  }

  return uniqueCommits;
};

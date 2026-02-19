import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

let _app: Octokit | null = null;

export function getGitHubApp(): Octokit {
  if (_app) return _app;

  _app = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
  });

  return _app;
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      installationId,
    },
  });
}

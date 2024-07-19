// Deployments API example
// See: https://developer.github.com/v3/repos/deployments/ to learn more
import { exec } from "child_process";
import path from "path";
 
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");
  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context) => {
      app.log.info(context.payload);
      const prNumber = context.payload.pull_request.number;
      const branchName = context.payload.pull_request.head.ref;
      const repoUrl = context.payload.repository.clone_url;
      const repo = context.payload.repository.name;
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const deployScriptPath = path.resolve(__dirname, "./scripts/deploy.sh");
      // not going to work on windows
      exec(
        `bash ${deployScriptPath} ${branchName} ${prNumber} ${repo} ${repoUrl}`,
        async (error, stdout, stderr) => {
          let body;
          if (error) {
            console.error(`Error executing deploy script: ${error}`);
            body = `### 🚨 Deployment Failed\n\n**Branch:** ${branchName}\n**PR:** #${prNumber}\n\nPlease check the logs for more details.`;
          } else if (stdout) {
            console.log(`Deploy script output: ${stdout}`);
            body = `### 🎉 Deployment Succeeded\n**Branch:** ${branchName}\n**PR:** #${prNumber}\n\nThe application has been successfully deployed for testing.`;
          }

          if (body) {
            const issueComment = context.issue({ body });
            await context.octokit.issues.createComment(issueComment);
          }

          if (stderr) {
            console.error(`Deploy script stderr: ${stderr}`);
          }
        }
      );
      // Make a comment
      const issueComment = context.issue({
        body: "Thanks for opening this issue!",
      });
      await context.octokit.issues.createComment(issueComment);
    }
  );

  app.on(
    ["pull_request.closed"],
    async (context) => {
      app.log.info(context.payload);
      const prNumber = context.payload.pull_request.number;
      const branchName = context.payload.pull_request.head.ref;
      const repoUrl = context.payload.repository.clone_url;
      const repo = context.payload.repository.name;
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const deployScriptPath = path.resolve(__dirname, "./scripts/cleanUp.sh");
      // not going to work on windows
      exec(
        `bash ${deployScriptPath} ${branchName} ${prNumber} ${repo} ${repoUrl}`,
        async (error, stdout, stderr) => {
          let body;
          if (error) {
            console.error(`Error executing clean up script: ${error}`);
            body = `### 🚨 Clean up Failed\n**Error:** ${error.message}\n**Branch:** ${branchName}\n**PR:** #${prNumber}\n\nPlease check the logs for more details.`;
          } else if (stdout) {
            console.log(`Clean up script output: ${stdout}`);
            body = `### 🎉 Clean up Succeeded\n**Branch:** ${branchName}\n**PR:** #${prNumber}`;
          }

          if (body) {
            const issueComment = context.issue({ body });
            await context.octokit.issues.createComment(issueComment);
          }

          if (stderr) {
            console.error(`Deploy script stderr: ${stderr}`);
          }
        }
      );
      // Make a comment
      const issueComment = context.issue({
        body: "Thanks for banking with with us",
      });
      await context.octokit.issues.createComment(issueComment);
    }
  );

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

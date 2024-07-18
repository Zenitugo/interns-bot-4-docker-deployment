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
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing deploy script: ${error}`);
            return;
          }
          console.log(`Deploy script output: ${stdout}`);
          if (stderr) {
            console.error(`Deploy script stderr: ${stderr}`);
          }
        }
      );

      const res = await context.octokit.repos.createDeployment(
        context.repo({
          ref: context.payload.pull_request.head.ref, // The ref to deploy. This can be a branch, tag, or SHA.
          task: "deploy", // Specifies a task to execute (e.g., deploy or deploy:migrations).
          auto_merge: false, // Attempts to automatically merge the default branch into the requested ref, if it is behind the default branch.
          required_contexts: [], // The status contexts to verify against commit status checks. If this parameter is omitted, then all unique contexts will be verified before a deployment is created. To bypass checking entirely pass an empty array. Defaults to all unique contexts.
          payload: {
            schema: "rocks!",
          }, // JSON payload with extra information about the deployment. Default: ""
          environment: "production", // Name for the target deployment environment (e.g., production, staging, qa)
          description: "My Probot App's first deploy!", // Short description of the deployment
          transient_environment: false, // Specifies if the given environment is specific to the deployment and will no longer exist at some point in the future.
          production_environment: true, // Specifies if the given environment is one that end-users directly interact with.
        })
      );

      const deploymentId = res.data.id;
      await context.octokit.repos.createDeploymentStatus(
        context.repo({
          deployment_id: deploymentId,
          state: "success", // The state of the status. Can be one of error, failure, inactive, pending, or success
          log_url: "https://example.com", // The log URL to associate with this status. This URL should contain output to keep the user updated while the task is running or serve as historical information for what happened in the deployment.
          description: "My Probot App set a deployment status!", // A short description of the status.
          environment_url: "https://example.com", // Sets the URL for accessing your environment.
          auto_inactive: true, // Adds a new inactive status to all prior non-transient, non-production environment deployments with the same repository and environment name as the created status's deployment. An inactive status is only added to deployments that had a success state.
        })
      );
      // Make a comment
      const issueComment = context.issue({
        body: "Thanks for opening this issue!",
      });
      await context.octokit.issues.createComment(issueComment);
    }
  );

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};

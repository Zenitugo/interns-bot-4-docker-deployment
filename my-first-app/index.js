import { exec } from "child_process";
import path from "path";

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  // Handle pull request events
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const prNumber = context.payload.pull_request.number;
    const branchName = context.payload.pull_request.head.ref;
    const repoUrl = context.payload.repository.clone_url;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const deploymentUrl = `http://your-deployment-server/pr-${prNumber}`;

    // Execute the deployment script
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const deployScriptPath = path.resolve(__dirname, "./scripts/deploy.sh");
    exec(
      `bash ${deployScriptPath} ${branchName} ${prNumber} ${repo} ${repoUrl}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing deploy script: ${error}`);
          // Comment on the pull request with the error
          context.octokit.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: `Deployment failed: ${error.message}`,
          });
          return;
        }
        console.log(`Deploy script output: ${stdout}`);
        if (stderr) {
          console.error(`Deploy script stderr: ${stderr}`);
        }

        // Comment on the pull request with the deployment link
        context.octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `Deployment successful! Access the deployed application at: [Deployment Link](${deploymentUrl})`,
        });
      }
    );

    // Create a deployment using the GitHub Deployments API
    const res = await context.octokit.repos.createDeployment(
      context.repo({
        ref: context.payload.pull_request.head.ref,
        task: "deploy",
        auto_merge: false,
        required_contexts: [],
        payload: {
          schema: "rocks!",
        },
        environment: "production",
        description: "My Probot App's first deploy!",
        transient_environment: false,
        production_environment: true,
      })
    );

    const deploymentId = res.data.id;
    await context.octokit.repos.createDeploymentStatus(
      context.repo({
        deployment_id: deploymentId,
        state: "success",
        log_url: "https://example.com",
        description: "My Probot App set a deployment status!",
        environment_url: "https://example.com",
        auto_inactive: true,
      })
    );
  });

  // Handle pull request closed event
  app.on("pull_request.closed", async (context) => {
    const prNumber = context.payload.pull_request.number;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;

    // Execute the cleanup script
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const cleanupScriptPath = path.resolve(__dirname, "./scripts/cleanup.sh");
    exec(
      `bash ${cleanupScriptPath} ${prNumber} ${repo}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing cleanup script: ${error}`);
          // Comment on the pull request with the error
          context.octokit.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: `Cleanup failed: ${error.message}`,
          });
          return;
        }
        console.log(`Cleanup script output: ${stdout}`);
        if (stderr) {
          console.error(`Cleanup script stderr: ${stderr}`);
        }

        // Comment on the pull request about the cleanup
        context.octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: "Deployment has been cleaned up.",
        });
      }
    );
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
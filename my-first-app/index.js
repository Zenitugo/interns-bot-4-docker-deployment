// // Deployments API example
// // See: https://developer.github.com/v3/repos/deployments/ to learn more

// /**
//  * This is the main entrypoint to your Probot app
//  * @param {import('probot').Probot} app
//  */
// export default (app) => {
//   // Your code here
//   app.log.info("Yay, the app was loaded!");
//   app.on(
//     ["pull_request.opened", "pull_request.synchronize"],
//     async (context) => {
//       // Creates a deployment on a pull request event
//       // Then sets the deployment status to success
//       // NOTE: this example doesn't actually integrate with a cloud
//       // provider to deploy your app, it just demos the basic API usage.
//       app.log.info(context.payload);

//       // Probot API note: context.repo() => { username: 'hiimbex', repo: 'testing-things' }
//       const res = await context.octokit.repos.createDeployment(
//         context.repo({
//           ref: context.payload.pull_request.head.ref, // The ref to deploy. This can be a branch, tag, or SHA.
//           task: "deploy", // Specifies a task to execute (e.g., deploy or deploy:migrations).
//           auto_merge: true, // Attempts to automatically merge the default branch into the requested ref, if it is behind the default branch.
//           required_contexts: [], // The status contexts to verify against commit status checks. If this parameter is omitted, then all unique contexts will be verified before a deployment is created. To bypass checking entirely pass an empty array. Defaults to all unique contexts.
//           payload: {
//             schema: "rocks!",
//           }, // JSON payload with extra information about the deployment. Default: ""
//           environment: "production", // Name for the target deployment environment (e.g., production, staging, qa)
//           description: "My Probot App's first deploy!", // Short description of the deployment
//           transient_environment: false, // Specifies if the given environment is specific to the deployment and will no longer exist at some point in the future.
//           production_environment: true, // Specifies if the given environment is one that end-users directly interact with.
//         }),
//       );

//       const deploymentId = res.data.id;
//       await context.octokit.repos.createDeploymentStatus(
//         context.repo({
//           deployment_id: deploymentId,
//           state: "success", // The state of the status. Can be one of error, failure, inactive, pending, or success
//           log_url: "https://example.com", // The log URL to associate with this status. This URL should contain output to keep the user updated while the task is running or serve as historical information for what happened in the deployment.
//           description: "My Probot App set a deployment status!", // A short description of the status.
//           environment_url: "https://example.com", // Sets the URL for accessing your environment.
//           auto_inactive: true, // Adds a new inactive status to all prior non-transient, non-production environment deployments with the same repository and environment name as the created status's deployment. An inactive status is only added to deployments that had a success state.
//         }),
//       );
//     },
//   );

//   // For more information on building apps:
//   // https://probot.github.io/docs/

//   // To get your app running against GitHub, see:
//   // https://probot.github.io/docs/development/
// };

import { Probot } from "probot";
import express from 'express';

const main = (app) => {
  // Listener for pull request opened event
  app.on('pull_request.opened', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const comment = context.issue({
      body: `Deployment started for PR #${prNumber}.`
    });
    await context.octokit.issues.createComment(comment);
  });

  // Listener for pull request synchronize event (e.g., when commits are added)
  app.on('pull_request.synchronize', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const comment = context.issue({
      body: `Deployment updated for PR #${prNumber}.`
    });
    await context.octokit.issues.createComment(comment);
  });

  // Listener for pull request closed event
  app.on('pull_request.closed', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const comment = context.issue({
      body: `Deployment cleaned up for PR #${prNumber}.`
    });
    await context.octokit.issues.createComment(comment);
  });
};

// Set up the Probot server
const probot = new Probot({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  secret: process.env.WEBHOOK_SECRET
});

// Load the main function
probot.load(main);

// Create an Express app for custom routes
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/status', async (req, res) => {
  const { status, pr_number, deployment_url } = req.body;

  let statusText;
  switch (status) {
    case 'started':
      statusText = 'Deployment Started';
      break;
    case 'successful':
      statusText = 'Deployed';
      break;
    case 'failed':
      statusText = 'Deployment Failed';
      break;
    case 'cleaned':
      statusText = 'Cleaned Up';
      break;
    default:
      statusText = 'Unknown Status';
  }

  let previewLink = deployment_url ? `[Link](${deployment_url})` : 'N/A';
  let updatedTime = new Date().toISOString();

  const commentBody = `
| Name   | Status            | Preview       | Comments | Updated       |
|--------|-------------------|---------------|----------|---------------|
| PR #${pr_number}  | ${statusText} | ${previewLink} |          | ${updatedTime} |
  `;

  const context = {
    repo: () => ({
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO_NAME
    }),
    octokit: probot.octokit
  };

  const comment = {
    owner: context.repo().owner,
    repo: context.repo().repo,
    issue_number: pr_number,
    body: commentBody
  };
  await context.octokit.issues.createComment(comment);
  res.status(200).send('Status update received');
});

app.use(probot.middleware);

app.listen(port, () => {
  console.log(`Probot app listening on port ${port}`);
});

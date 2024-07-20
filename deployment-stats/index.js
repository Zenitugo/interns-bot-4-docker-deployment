import { Probot } from 'probot';

/**
 * This is the main entrypoint to your Probot app
 * @param {Probot} app
 */
export default (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on(
    ["pull_request.opened", "pull_request.reopened"],
    async (context) => {
      // Call custom deployment logic
      await triggerWorkflow(context.payload.pull_request, context.payload.repository, context);
    },
  );

  app.on(
    ["pull_request.synchronize"], 
    async (context) => {
    await triggerWorkflow(context, 'synchronize');
  });

  app.on(
    "pull_request.closed",
    async (context) => {
      // Call custom cleanup logic
      await triggerWorkflow(context.payload.pull_request, context.payload.repository, context);
    },
  );

  // Custom deployment function
  async function deployPR(pullRequest, repository, context) {
    app.log.info(`Deploying PR #${pullRequest.number}`);

    // Your deployment logic here
    await context.octokit.actions.createWorkflowDispatch({
      owner: repository.owner.login,
      repo: repository.name,
      workflow_id: 'pr.yml',
      ref: pullRequest.head.ref,
      inputs: {
        pr_number: pullRequest.number.toString(),
        pr_sha: pullRequest.head.sha
      }
    });

    // Update PR with comment
    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pullRequest.number,
      body: `Deployment for PR #${pullRequest.number} is in progress. You can track the status here: [Deployment Status](https://zenitugo.github.io/zeni-personal-bot/deployment-stats/${pullRequest.number})`
    });

    // Update deployment status in backend
    await fetch(`https://bot-deployment-service.onrender.com/deployment-stats/${pullRequest.number}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'in progress' })
    });
  }

  // Custom cleanup function
  async function cleanupPR(pullRequest, repository, context) {
    app.log.info(`Cleaning up PR #${pullRequest.number}`);

    // Your cleanup logic here
    await context.octokit.actions.createWorkflowDispatch({
      owner: repository.owner.login,
      repo: repository.name,
      workflow_id: 'pr.yml',
      ref: repository.default_branch,
      inputs: {
        pr_number: pullRequest.number.toString()
      }
    });

    // Update PR with cleanup status
    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pullRequest.number,
      body: `Resources for PR #${pullRequest.number} have been cleaned up.`
    });

    // Update deployment status in backend
    await fetch(`https://bot-deployment-service.onrender.com/deployment-stats/${pullRequest.number}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'cleaned up' })
    });
  }
};


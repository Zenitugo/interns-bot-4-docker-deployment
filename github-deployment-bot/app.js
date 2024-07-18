const { exec } = require('child_process');

module.exports = (app) => {
  // Handler for when a pull request is opened
  app.on('pull_request.opened', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const branch = context.payload.pull_request.head.ref;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const deploymentUrl = `http://your-deployment-server/pr-${prNumber}`;

    // Deploy the PR branch in the background
    exec(`docker build -t ${repo}:pr-${prNumber} . && docker run -d --name pr-${prNumber} -p 8080:80 ${repo}:pr-${prNumber}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during deployment: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Deployment stderr: ${stderr}`);
        return;
      }
      console.log(`Deployment stdout: ${stdout}`);

      // Comment on the PR with the deployment link
      context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `Deployment complete: [Deployment Link](${deploymentUrl})`,
      });
    });
  });

  // Handler for when a pull request is updated with new commits
  app.on('pull_request.synchronize', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const branch = context.payload.pull_request.head.ref;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const deploymentUrl = `http://your-deployment-server/pr-${prNumber}`;

    // Redeploy the updated PR branch in the background
    exec(`docker stop pr-${prNumber} && docker rm pr-${prNumber} && docker build -t ${repo}:pr-${prNumber} . && docker run -d --name pr-${prNumber} -p 8080:80 ${repo}:pr-${prNumber}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during deployment: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Deployment stderr: ${stderr}`);
        return;
      }
      console.log(`Deployment stdout: ${stdout}`);

      // Update the PR comment with the deployment link
      context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `Deployment updated: [Deployment Link](${deploymentUrl})`,
      });
    });
  });

  // Handler for when a pull request is closed or merged
  app.on('pull_request.closed', async (context) => {
    const prNumber = context.payload.pull_request.number;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;

    // Clean up the Docker container
    exec(`docker stop pr-${prNumber} && docker rm pr-${prNumber}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during cleanup: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Cleanup stderr: ${stderr}`);
        return;
      }
      console.log(`Cleanup stdout: ${stdout}`);

      // Comment on the PR about the cleanup
      context.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: 'Deployment has been cleaned up.',
      });
    });
  });
};

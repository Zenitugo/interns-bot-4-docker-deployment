// app.js
const { Probot } = require('probot');
const Docker = require('dockerode');

// Initialize the Docker client
const docker = new Docker();

module.exports = (app) => {
  app.log.info('Yay, the app was loaded!');

  app.on('pull_request', async (context) => {
    await handlePullRequestEvent(context);
  });
};

async function handlePullRequestEvent(context) {
  const { action, number, html_url, head } = context.payload.pull_request;
  const { repo, owner } = context.payload.repository;
  const repoUrl = `https://github.com/${owner.login}/${repo.name}`;
  const branchName = head.ref;

  switch (action) {
    case 'opened':
      await commentOnPullRequest(context, 'Deployment started for this pull request.');
      await deployBranch(context, owner, repo, branchName);
      break;
    case 'synchronize':
      await commentOnPullRequest(context, 'Deployment updated with the latest changes.');
      await deployBranch(context, owner, repo, branchName);
      break;
    case 'closed':
      await commentOnPullRequest(context, 'Deployment has been terminated.');
      await cleanupDeployment(context, owner, repo, branchName);
      break;
    default:
      break;
  }
}

async function deployBranch(context, owner, repo, branchName) {
  try {
    // Build the Docker image
    const buildStream = await docker.buildImage({
      context: '.',
      src: ['Dockerfile', '.']
    }, {
      t: `${owner.login}/${repo.name}:${branchName}`,
      rm: true
    });

    buildStream.on('data', (data) => {
      context.app.log.info(`${data.toString('utf8')}`);
    });

    await new Promise((resolve, reject) => {
      buildStream.once('error', reject);
      buildStream.once('end', resolve);
    });

    context.app.log.info('Docker image built successfully');

    // Run the Docker container
    const container = await docker.createContainer({
      Image: `${owner.login}/${repo.name}:${branchName}`,
      name: `${repo.name}-${branchName}`,
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: '' }]
        }
      }
    });

    await container.start();

    const containerData = await container.inspect();
    const deploymentUrl = `http://${containerData.NetworkSettings.IPAddress}`;

    context.app.log.info(`Container deployed at ${deploymentUrl}`);

    // Comment on the pull request with the deployment URL
    await commentOnPullRequest(context, `Deployment successful! Access the deployed application at: ${deploymentUrl}`);
  } catch (error) {
    context.app.log.error(`Error during deployment: ${error.message}`);
  }
}

async function cleanupDeployment(context, owner, repo, branchName) {
  try {
    // Remove the Docker container
    const container = docker.getContainer(`${repo.name}-${branchName}`);
    await container.remove({ force: true });
    context.app.log.info(`Deployment for branch ${branchName} has been cleaned up.`);
  } catch (error) {
    context.app.log.error(`Error cleaning up deployment for branch ${branchName}: ${error.message}`);
  }
}

async function commentOnPullRequest(context, comment) {
  try {
    await context.octokit.issues.createComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.pull_request.number,
      body: comment,
    });
    context.app.log.info(`Commented on pull request #${context.payload.pull_request.number}: ${comment}`);
  } catch (error) {
    context.app.log.error(`Error commenting on pull request #${context.payload.pull_request.number}: ${error.message}`);
  }
}
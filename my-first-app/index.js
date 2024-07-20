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
    ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
    async (context) => {
      app.log.info(context.payload);
      const prNumber = context.payload.pull_request.number;
      const serverUser = process.env.SERVER_USER;
      const serverIp = process.env.SERVER_IP;
      const serverPassword = process.env.SERVER_PASSWORD;
      const branchName = context.payload.pull_request.head.ref;
      const repoUrl = context.payload.repository.clone_url;
      const repo = context.payload.repository.name;
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const deployScriptPath = path.resolve(__dirname, "./scripts/deploy.sh");

       // not going to work on windows
       const retriveComment = (status) => {
        return status === "Deployed"
          ? `
              <table>
              <tr>
                <th>Branch Name</th>
                <th>Deployment Stage</th>
                <th>Log URL</th>
                <th>Preview</th>
              </tr>
              <tr>
                <td>${branchName}</td>
                <td>${status}</td>
                <td><a href="http://${serverIp}:7000?url=http://${serverIp}:8000">View Logs</a></td>
                <td><a href="http://${serverIp}:8000">Preview page</a></td>
              </tr>
            </table>`
          : `<table>
          <tr>
            <th>Branch Name</th>
            <th>Deployment Stage</th>
            <th>Log URL</th>
            <th>Preview</th>
          </tr>
          <tr>
            <td>${branchName}</td>
            <td>${status}</td>
            <td><a href="http://${serverIp}:7000?url=http://${serverIp}:8000">View Logs</a></td>
            <td></td>
          </tr>
        </table>`;
      };

      exec(
        `bash ${deployScriptPath} ${repoUrl} ${prNumber} ${serverUser} ${serverIp} ${serverPassword} ${branchName} `,
        async (error, stdout, stderr) => {
          let body;
          if (error) {
            console.error(`Error executing deploy script: ${error}`);
            body = retriveComment('Failed')
          } else if (stdout) {
            console.log(`Deploy script output: ${stdout}`);
            body = retriveComment('Deployed')
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
        body: retriveComment('Deploying')
      });
      await context.octokit.issues.createComment(issueComment);
    }
  );

  app.on(["pull_request.closed"], async (context) => {
    app.log.info(context.payload);
    const prNumber = context.payload.pull_request.number;
    const branchName = context.payload.pull_request.head.ref;
    // const repoUrl = context.payload.repository.clone_url;
    const repo = context.payload.repository.name;
    const serverUser = process.env.SERVER_USER;
    const serverIp = process.env.SERVER_IP;
    const serverPassword = process.env.SERVER_PASSWORD;
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const deployScriptPath = path.resolve(__dirname, "./scripts/cleanUp.sh");

    const retriveComment = (status) => {
      return status === "Deployed"
        ? `
          <table>
          <tr>
            <th>Branch Name</th>
            <th>Deployment Stage</th>
            <th>Log URL</th>
            <th>Preview</th>
          </tr>
          <tr>
            <td>${branchName}</td>
            <td>${status}</td>
            <td><a href="http://${serverIp}:7000?url=http://${serverIp}:8000">View Logs</a></td>
            <td><a href="http://${serverIp}:7000?url=http://${serverIp}:8000">View Logs</a></td>
          </tr>
          </table>`
        : `<table>
        <tr>
          <th>Branch Name</th>
          <th>Deployment Stage</th>
          <th>Log URL</th>
          <th>Preview</th>
        </tr>
        <tr>
          <td>${branchName}</td>
          <td>${status}</td>
          <td><a href="http://${serverIp}:7000?url=http://${serverIp}:8000">View Logs</a></td>
          <td></td>
        </tr>
      </table>`;
    };

    exec(
      `bash ${deployScriptPath} ${branchName} ${prNumber} ${repo} ${serverUser} ${serverIp} ${serverPassword}`,
      async (error, stdout, stderr) => {
        let body;
        if (error) {
          console.error(`Error executing clean up script: ${error}`);
          body = retriveComment('Failed')
        } else if (stdout) {
          console.log(`Clean up script output: ${stdout}`);
          body = retriveComment('Cleaned Up')
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
      body: retriveComment('Cleaning Up')
    });
    await context.octokit.issues.createComment(issueComment);
  });

};

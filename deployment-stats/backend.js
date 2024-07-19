const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(cors());

let deployments = {};

// Load existing deployments from file
if (fs.existsSync('./deployments.json')) {
  deployments = JSON.parse(fs.readFileSync('./deployments.json', 'utf-8'));
}

// Get deployment status
app.get('/deployments/:prNumber', (req, res) => {
  const prNumber = req.params.prNumber;
  const status = deployments[prNumber];
  if (status) {
    res.json({ prNumber, status });
  } else {
    res.status(404).json({ error: 'Deployment status not found' });
  }
});

// Update deployment status
app.post('/deployments/:prNumber', (req, res) => {
  const prNumber = req.params.prNumber;
  const status = req.body.status;
  deployments[prNumber] = status;

  // Save deployments to file
  fs.writeFileSync('./deployments.json', JSON.stringify(deployments, null, 2));
  res.json({ prNumber, status });
});

app.listen(port, () => {
  console.log(`Deployment status server running at http://localhost:${port}`);
});

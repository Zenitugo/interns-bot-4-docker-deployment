const express = require('express');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    const { url } = req.query;
    // read from a file line by line
    const filePath = path.join(__dirname, 'cleanup.log');
    const logs = [];

    const readInterface = readline.createInterface({
        input: fs.createReadStream(filePath)
    });
    for await (const line of readInterface) {
        logs.push(line);
    }

    res.render('index', { logs, url });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

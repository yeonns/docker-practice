const path = require('path');
const fs = require('fs').promises;
const contstants = require('fs').constants;
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use('/subscription', express.static('subscription'));

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'pages', 'subscription.html');
  res.sendFile(filePath);
});

app.get('/check', (req, res) => {
  const filePath = path.join(__dirname, 'pages', 'check.html');
  res.sendFile(filePath);
});

app.post('/subscribe', async(req, res) => {
  const name = req.body.name;

  const tempFilePath = path.join(__dirname, 'temp', name);
  const finalFilePath = path.join(__dirname, 'subscription', name);

  await fs.writeFile(tempFilePath, "");

  fs.access(finalFilePath, contstants.F_OK)
    .then(async() => {
      res.redirect('/check')
    }).catch(async() => {
      await fs.copyFile(tempFilePath, finalFilePath);
      await fs.unlink(tempFilePath);
      res.redirect('/');
    })
});

app.listen(3000);
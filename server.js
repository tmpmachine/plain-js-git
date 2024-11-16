const express = require('express');
const https = require('https');
const fs = require('fs');

// Server configuration
const port = 8184;
const dir = 'src/';

// Create an Express app
const app = express();
app.use(express.static(dir));
app.listen(port, () => {
  console.log(`${dir}: http://localhost:${port}/`);
});
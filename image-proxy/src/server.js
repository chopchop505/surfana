'use strict';

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const CameraStore = require('./db/camera_store');

// Define express endpoints
const app = express();

// Proxy images requests
app.use('/images', createProxyMiddleware({ 
  target: 'http://www.example.org', // target host
  changeOrigin: true ,
  pathRewrite: {
    '^/images': '' // remove base path
  },
  router: async (req) => {
    let camera = await CameraStore.find(req.query.spotName);
    return camera.still_url;
  }
}));


// Start listening
const port = 3001;
app.listen(port);

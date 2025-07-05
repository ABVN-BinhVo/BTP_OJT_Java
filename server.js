const cds = require('@sap/cds');
const express = require('express');

cds.on('bootstrap', app => {
  // Serve static content from webapp folder
  app.use(express.static('app'));
  
  // Proxy requests for SAPUI5 resources to the CDN
  app.use('/resources', (req, res) => {
    res.redirect(`https://ui5.sap.com/resources${req.url}`);
  });


  
  // Alternatively, if you have a specific version you want to use:
  // app.use('/resources', (req, res) => {
  //   res.redirect(`https://ui5.sap.com/1.108.0/resources${req.path}`);
  // });
});

module.exports = cds.server;
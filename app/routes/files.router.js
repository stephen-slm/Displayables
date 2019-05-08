const { Router } = require('express');
const express = require('express');
const path = require('path');

const filesRouter = Router();

const combine = (combinedPath) => path.join(__dirname, combinedPath);

filesRouter.use('/assets', express.static(combine('../public/assets')));
filesRouter.get('/', (req, res) => res.sendFile(combine('../public/index.html')));
filesRouter.get('/login', (req, res) => res.sendFile(combine('../public/pages/login.html')));
filesRouter.get('/management', (req, res) => res.sendFile(combine('../public/pages/management.html')));
filesRouter.get('/workstation/edit', (req, res) => res.sendFile(combine('../public/pages/edit.html')));
filesRouter.get('/workstation', (req, res) => res.sendFile(combine('../public/pages/workstation.html')));

filesRouter.get('/old/workstation', (req, res) =>
  res.sendFile(combine('../public/pages/deprecated/workstation.html'))
);

filesRouter.get('/public', (req, res) => res.sendFile(combine('../public/pages/public.html')));

filesRouter.use('*', (req, res) => res.sendFile(combine('../public/pages/404.html')));

module.exports = filesRouter;

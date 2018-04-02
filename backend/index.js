
import fs from 'fs';
import path from 'path';
import http from 'http';
import walk from 'walkdir';
import async from 'async';
import express from 'express';

function buildApp (config, callback) {
  const {isDevelopment, appDir, baseUrl, rootDir} = config;
  const examplesPath = path.join(rootDir, 'examples');
  const cacheFile = path.join(rootDir, 'cache.json');
  const app = express();

  /* Enable strict routing to make trailing slashes matter. */
  app.enable('strict routing');

  app.set('view engine', 'pug');
  app.set('views', path.join(appDir, 'backend'));

  if (isDevelopment) {
    /* Development route: /build is managed by webpack */
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackConfig = require('../webpack.config.js');
    const compiler = webpack(webpackConfig);
    app.use('/build', webpackDevMiddleware(compiler, {
      stats: {
        colors: true,
        chunks: false
      }
    }));
  } else {
    /* Production route: /build serves static files in build/ */
    app.use('/build', express.static(path.join(appDir, 'build')));
  }

  /* Serve static assets. */
  app.use('/assets', express.static(path.join(appDir, 'assets')));

  app.get('/', function (req, res) {
    let {callback: callbackUrl, tags} = req.query;
    tags = (tags||'').split(',').filter(tag => tag);
    const options = {baseUrl, callbackUrl, tags};
    res.render('index', {isDevelopment, rebaseUrl, options});
  });

  app.get('/examples.json', function (req, res) {
    scanExamples(examplesPath, function (err, examples, errors) {
      if (err) return res.json({error: err.toString()});
      const tags = collectTags(examples);
      res.json({success: true, data: {examples, tags, errors}});
    });
    /*
    if (cache file exists) {
      readFile(cacheFile, function (err, text) {
        if (err) return res.json({error: err.toString()});
        res.send(text);
      });
    } else {
      // scan examples, write cache file, 
    }
    */
  });

  callback(null, app);

  function rebaseUrl (url) {
    return `${config.baseUrl}/${url}`;
  }
}

function scanExamples (rootPath, callback) {
  const filenames = [];
  walk(rootPath).on('file', function (filename, stat) {
    if (/\.c$/.test(filename)) {
      filenames.push(filename);
    }
  }).on('end', function () {
    const examples = [], errors = [];
    async.forEach(filenames, function (filename, callback) {
      const relPath = dropPrefix(rootPath, filename);
      fs.readFile(filename, 'utf8', function (err, text) {
        if (err) return callback(err);
        try {
          const [firstLine] = text.split('\n', 1);
          const md = /\/\*(.*)\*\//.exec(firstLine);
          const meta = JSON.parse(md[1]);
          meta.origin = relPath;
          meta.source = text.slice(firstLine.length + 1);
          examples.push(meta);
        } catch (ex) {
          errors.push({origin: relPath});
        }
        callback(null);
      });
    }, function (err) {
      if (err) return callback(err);
      callback(null, examples, errors);
    });
  });
}

function collectTags (examples) {
  const tags = new Set();
  for (let example of examples) {
    if (example.tags) {
      for (let tag of example.tags) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags.keys()).sort();
}

function dropPrefix (prefix, str) {
  if (str.startsWith(prefix)) {
    str = str.slice(prefix.length).replace(/^\/+/, '');
  }
  return str
}

const config = {
  appDir: path.resolve(path.dirname(__dirname)),
  baseUrl: process.env.BASE_URL || '',
  isDevelopment: process.env.NODE_ENV !== 'production',
  port: process.env.PORT,
  mountPath: process.env.MOUNT_PATH,
};
config.rootDir = process.env.ROOT_DIR || config.appDir;
buildApp(config, function (err, app) {
  if (err) {
    console.log("backend failed to start", err);
    process.exit(1);
  }
  if (config.mountPath) {
    console.log(`serving at ${config.mountPath}`);
    const rootApp = express();
    rootApp.use(config.mountPath, app);
    app = rootApp;
  }
  const server = http.createServer(app);
  server.listen(config.port);
});

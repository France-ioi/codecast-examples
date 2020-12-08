require('dotenv').config();

import fs from 'fs';
import path from 'path';
import http from 'http';
import walk from 'walkdir';
import async from 'async';
import express from 'express';

function buildApp(config, callback) {
    const {isDevelopment, appDir, baseUrl, rootDir} = config;
    const examplesPath = path.join(rootDir, 'examples');
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
        let {callback: callbackUrl, tags, lang, target} = req.query;
        tags = (tags || '').split(',').filter(tag => tag);

        const options = {baseUrl, callbackUrl, tags, lang, target};

        res.render('index', {isDevelopment, rebaseUrl, options});
    });

    app.get('/examples.json', function (req, res) {
        const lang = req.query.lang || 'en';

        scanExamples(examplesPath, {lang}, function(err, examples, errors) {
            if (err) {
                return res.json({error: err.toString()});
            }

            const tags = collectTags(examples);

            res.json({success: true, data: {examples, tags, errors}});
        });
    });

    callback(null, app);

    function rebaseUrl(url) {
        return `${config.baseUrl}/${url}`;
    }
}

function scanExamples(rootPath, options, callback) {
    let filepaths = [];
    walk(rootPath).on('file', function (filepath, stat) {
        if (/\.c$/.test(filepath) || /\.py$/.test(filepath)) {
            filepaths.push(filepath);
        }
    }).on('end', function () {
        const examples = [], errors = [];

        filepaths = filterExampleFilepaths(filepaths, options);

        async.forEach(filepaths, function(filepath, callback) {
            const relPath = dropPrefix(rootPath, filepath);
            fs.readFile(filepath, 'utf8', function (err, text) {
                if (err) {
                    return callback(err);
                }

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
            if (err) {
                return callback(err);
            }

            examples.sort((e1, e2) => e1.title.localeCompare(e2.title));

            callback(null, examples, errors);
        });
    });
}

function filterExampleFilepaths(filepaths, options) {
    const keyMap = new Map();
    for (const filepath of filepaths) {
        const {directory, key, lang} = decodeFilepath(filepath);

        let variants = keyMap.get(directory + '-' + key);

        if (!variants) {
            variants = new Map();
            keyMap.set(directory + '-' + key, variants);
        }

        variants.set(lang, filepath);
    }

    /* filter language is 'en' if unspecified */
    let {lang} = options;
    if (!lang) {
        lang = 'en';
    }

    const result = [];
    for (const [key, variants] of keyMap.entries()) {
        if (variants.has(lang)) {
            result.push(variants.get(lang));
        } else if (variants.has('en')) {
            /* fall back to english if no match for user language */
            result.push(variants.get('en'));
        }
    }

    return result.sort();
}

function decodeFilepath(filepath) {
    const md = /^.*\/(.*)\/([A-Za-z0-9_-]+)(?:\.([a-z]{2}))?\..*$/.exec(filepath);
    if (!md) {
        return false;
    }

    const directory = md[1];
    const key = md[2];
    const lang = md[3] || 'en'; /* example language is 'en' if unspecified */

    return {directory, key, lang};
}

function collectTags(examples) {
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

function dropPrefix(prefix, str) {
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

# Examples for [Codecast](https://github.com/France-ioi/codecast)

### Installation

Copy `.env.dist` into `.env` and define the variables :

- **NODE_ENV** : Either development or production.
- **MOUNT_PATH** : To specify the mount path of the app "/examples/".
- **BASE_URL** : The base url of this app.
- **PORT** : The listening port
- **ROOT_DIR** : The local path of the app. Defaults to the current directory if set to "".


Then install the dependencies :

    yarn install

### Development mode

Set NODE_ENV=development in .env

    yarn start

### Production mode

Set NODE_ENV=production in .env

    yarn run build
    yarn start

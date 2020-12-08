import IntlMessageFormat from 'intl-messageformat';
import memoize from 'lodash.memoize';

const Messages = {
    'en-US': require('./i18n/en-US.js'),
    'fr-FR': require('./i18n/fr-FR.js')
};

const Message = {
    toString: function () {
        return this._m;
    },
    format: function (...args) {
        if (!this._f) {
            this._f = new IntlMessageFormat(this._m, this._l);
        }
        return this._f.format(...args);
    },
    [Symbol.iterator]: function* () {
        yield this.toString();
    }
};
Object.defineProperty(Message, 's', {
    get() {
        return this.toString();
    }
});

function setLanguageReducer(state, {payload: {language}}) {
    if (!Messages[language]) {
        language = 'en-US';
    }

    const localizedMessage = Object.create(Message, {
        _l: {
            writable: false,
            configurable: false,
            value: language
        }
    });

    const getMessage = memoize(function (message, defaultText) {
        const value = Messages[language][message] || defaultText || `L:${message}`;
        return Object.create(localizedMessage, {
            _m: {
                writable: false,
                configurable: false,
                value
            }
        });
    });
    getMessage.format = function (value) {
        return getMessage(value.toString());
    }

    return {...state, language, getMessage};
}

export default {
    actionTypes: {
        setLanguage: 'Language.Set',
    },
    actionReducers: {
        setLanguage: setLanguageReducer,
    },
};

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, createStore} from 'redux';
import createSagaMiddleware from 'redux-saga';

import link from './linker';
import AppBundle from './app';

export function start(container, options) {
    const {actionTypes, views, selectors, reducer, rootSaga} = link(AppBundle);

    const sagaMiddleware = createSagaMiddleware();
    const enhancer = applyMiddleware(sagaMiddleware);

    function safeReducer(state, action) {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('reduce', action);
            }

            return reducer(state, action);
        } catch (ex) {
            console.error('action failed to reduce', action, ex);

            return {...state, lastError: ex};
        }
    }

    const store = createStore(safeReducer, {actionTypes, views, selectors}, enhancer);

    function start() {
        store.dispatch({type: actionTypes.appStarted});
        sagaMiddleware.run(rootSaga).done.catch(function (error) {
            store.dispatch({type: actionTypes.appCrashed, payload: {error}});
        });
    }

    if (process.env.NODE_ENV === 'development') {
        Object.assign(exports, {actionTypes, selectors, start, store});
    }

    store.dispatch({type: actionTypes.setLanguage, payload: {language: options.lang}});
    store.dispatch({type: actionTypes.appInitialized, payload: {options}});

    start();

    ReactDOM.render(<Provider store={store}>
        <views.App/>
    </Provider>, container);
}


import React from 'react';
import {connect} from 'react-redux';
import {call, put, select} from 'redux-saga/effects';
import fetchPonyfill from 'fetch-ponyfill';

import style from './style.css';

const {fetch} = fetchPonyfill();

function appInitializedReducer (state, {payload: {options}}) {
  return {...state, options, loading: true};
}

function appStartedReducer (state, action) {
  return {...state, lastError: false, start: false};
}

function appCrashedReducer (state, {payload: {error, start}}) {
  return {...state, lastError: error, start};
}

function examplesLoadSucceededReducer (state, {payload: {tags, examples}}) {
  return {...state, loading: false, tags, examples};
}

function examplesLoadFailedReducer (state, {payload: {error}}) {
  return {...state, loading: false, lastError: error};
}

function AppSelector (state) {
  const {lastError, loading, examples, tags} = state;
  return {error: lastError, loading, examples, tags};
}

class App extends React.PureComponent {
  render () {
    const {error, loading, examples, tags} = this.props;
    if (error) {
      return <p class='alert'>{error.toString()}</p>;
    }
    if (loading) {
      return <p>{"loading"}</p>;
    }
    if (!examples) {
      return <p>{"examples failed to load"}</p>;
    }
    return (
      <div>
        <p>{tags.length}{" tags"}</p>
        <p>{examples.length}{" examples"}</p>
      </div>
    );
  }
}

function jsonGet (url) {
  return new Promise(function (resolve, reject) {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    }).then(function (response) {
      if (response.status !== 200) return reject(response);
      response.json().catch(reject).then(function (result) {
        if (!result.success) return reject(result.error);
        resolve(result.data);
      });
    }).catch(reject);
  });
}

function* appSaga () {
  const {options: {baseUrl}, actionTypes} = yield select(state => state);
  let response;
  try {
    response = yield call(jsonGet, `${baseUrl}/examples.json`);
  } catch (ex) {
    yield put({type: actionTypes.examplesLoadFailed, payload: {error: ex}});
    return;
  }
  yield put({type: actionTypes.examplesLoadSucceeded, payload: response});
}

export default {
  actionTypes: {
    appInitialized: 'App.Inititalized',
    appStarted: 'App.Started',
    appCrashed: 'App.Crashed',
    examplesLoadSucceeded: 'Examples.Load.Succeeded',
    examplesLoadFailed: 'Examples.Load.Failed',
  },
  actionReducers: {
    appInitialized: appInitializedReducer,
    appStarted: appStartedReducer,
    appCrashed: appCrashedReducer,
    examplesLoadSucceeded: examplesLoadSucceededReducer,
    examplesLoadFailed: examplesLoadFailedReducer,
  },
  views: {
    App: connect(AppSelector)(App)
  },
  saga: appSaga
};

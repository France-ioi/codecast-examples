
import React from 'react';
import {connect} from 'react-redux';

import style from './style.css';

function AppSelector (state) {
  return {};
}

class App extends React.PureComponent {
  render () {
    return <p>{"It works"}</p>;
  }
}

function appInitializedReducer (state, {payload: {options}}) {
  return {options};
}

function appStartedReducer (state, action) {
  return {...state, lastError: false, start: false};
}

function appCrashedReducer (state, {payload: {error, start}}) {
  return {...state, lastError: error, start};
}

export default {
  actionTypes: {
    appInitialized: 'App.Inititalized',
    appStarted: 'App.Started',
    appCrashed: 'App.Crashed',
  },
  actionReducers: {
    appInitialized: appInitializedReducer,
    appStarted: appStartedReducer,
    appCrashed: appCrashedReducer,
  },
  views: {
    App: connect(AppSelector)(App)
  }
};

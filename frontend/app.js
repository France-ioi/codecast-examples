import url from 'url';
import React from 'react';
import {connect} from 'react-redux';
import {call, fork, put, select, takeEvery} from 'redux-saga/effects';
import fetchPonyfill from 'fetch-ponyfill';
import {Button, FormGroup, Intent, NonIdealState, Spinner, Switch, Tag} from '@blueprintjs/core';
import I18nBundle from './i18n';

import './style.css';

const {fetch} = fetchPonyfill();

function appInitializedReducer(state, {payload: {options}}) {
    return {
        ...state, options, loaded: false, loading: true,
        selectedTags: options.tags || []
    };
}

function appStartedReducer(state, action) {
    return {...state, lastError: false, start: false};
}

function appCrashedReducer(state, {payload: {error, start}}) {
    return {...state, lastError: error, start};
}

function examplesLoadSucceededReducer(state, {payload: {tags, examples}}) {
    return {...state, loaded: true, loading: false, tags, examples};
}

function examplesLoadFailedReducer(state, {payload: {error}}) {
    return {...state, loading: false, lastError: error};
}

function exampleSelectedReducer(state, {payload: {example}}) {
    return {...state, selectedExample: example};
}

function tagFilterChangedReducer(state, {payload: {tag, selected}}) {
    let {selectedTags} = state;

    if (selected) {
        selectedTags = [tag];
    } else {
        selectedTags = selectedTags.filter(other => other !== tag);
    }

    return {
        ...state,
        selectedTags
    };
}

function lateReducer(state) {
    const {loaded, examples, selectedTags} = state;
    const filteredExamples = loaded ? applyTagFilters(examples, selectedTags) : [];

    return {...state, filteredExamples};
}

function applyTagFilters(examples, tags) {
    if (tags.length === 0) {
        return examples;
    }

    return examples.filter((example) => example.tags && isArraySubset(tags, example.tags));
}

function isArraySubset(a, b) {
    for (let tag of a) {
        if (b.indexOf(tag) === -1) {
            return false;
        }
    }

    return true;
}

function AppSelector(state) {
    const {lastError, getMessage, loading, filteredExamples, tags, selectedTags, selectedExample, actionTypes} = state;

    return {
        error: lastError,
        getMessage,
        loading,
        examples: filteredExamples,
        selectedTags,
        tags,
        selectedExample,
        actionTypes
    };
}

class App extends React.PureComponent {
    render() {
        const {error, getMessage, loading, examples, tags, selectedTags, selectedExample} = this.props;

        if (error) {
            return <p className='alert'>{error.toString()}</p>;
        }
        if (loading) {
            return <Spinner intent={Intent.PRIMARY}/>;
        }
        if (!examples) {
            return <p>{getMessage('LOAD_EXAMPLES_FAILED')}</p>;
        }

        return (
            <div className='pt-app examples-app'>
                <div style={{float: 'left', width: '400px'}}>
                    <h3>{getMessage('AVAILABLE_EXAMPLES')}</h3>
                    <FormGroup label={getMessage('TAG_FILTERING_MESSAGE')}>
                        {tags.map((tag) =>
                            <FilterTag
                                key={tag}
                                tag={tag}
                                selected={-1 !== selectedTags.indexOf(tag)}
                                onChange={this._changeTagFilter}
                                label={getMessage(`tag:${tag}`, tag)}
                            />
                        )}
                    </FormGroup>
                    <p>{getMessage('SELECT_EXAMPLE_MESSAGE')}</p>
                    <ul>
                        {examples.map((example) =>
                            <ExampleLink key={example.origin} example={example} onSelect={this._selectExample}/>
                        )}
                    </ul>
                </div>
                <div style={{width: '600px'}}>
                    {selectedExample ?
                        <div>
                            <div style={{float: 'right'}}>
                                <Button onClick={this._useExample} rightIcon='arrow-right' intent={Intent.PRIMARY}>
                                    {getMessage('USE_EXAMPLE_BUTTON')}
                                </Button>
                            </div>
                            <h3>{selectedExample.title}</h3>
                            <pre className='pt-elevation-2' style={{overflow: 'scroll'}}>
                              {selectedExample.source}
                            </pre>
                            <p>
                                {(selectedExample.tags || []).map(tag =>
                                    <Tag key={tag} intent={Intent.PRIMARY}>{getMessage(`tag:${tag}`, tag)}</Tag>
                                )}
                            </p>
                        </div>
                    :
                        <NonIdealState
                            title={getMessage('NO_EXAMPLE_SELECTED')}
                            description={getMessage('NO_EXAMPLE_SELECTED_DESC')}
                            visual='hand-left'
                        />
                    }
                </div>
            </div>
        );
    }

    _changeTagFilter = (tag, selected) => {
        this.props.dispatch({type: this.props.actionTypes.tagFilterChanged, payload: {tag, selected}});
    };
    _selectExample = (example) => {
        this.props.dispatch({type: this.props.actionTypes.exampleSelected, payload: {example}});
    };
    _useExample = () => {
        this.props.dispatch({type: this.props.actionTypes.exampleUsed, payload: {example: this.props.selectedExample}});
    };
}

class FilterTag extends React.PureComponent {
    render() {
        const {tag, label, selected} = this.props;
        if (true) { /* UI option 1, use clickable tags */
            return (
                <Tag intent={selected ? Intent.PRIMARY : Intent.NONE} interactive={true} onClick={this._click}>
                    {label}
                </Tag>
            );
        }
        return ( /* UI option 2, use switches */
            <Switch checked={selected} onChange={this._click} label={tag} inline={true}/>
        );
    }

    _click = () => {
        this.props.onChange(this.props.tag, !this.props.selected);
    };
}


class ExampleLink extends React.PureComponent {
    render() {
        const {example} = this.props;
        return (
            <li style={{cursor: 'pointer'}} onClick={this._click}>
                {example.title}
            </li>
        );
    }

    _click = (event) => {
        event.stopPropagation();
        this.props.onSelect(this.props.example);
    };
}

function jsonGet(url) {
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

function* appSaga() {
    const {actionTypes} = yield select(state => state);

    yield fork(loadExamples);

    yield takeEvery(actionTypes.exampleUsed, useExample);
}

function* loadExamples() {
    const {options: {baseUrl, lang}, actionTypes} = yield select(state => state);
    let response;

    /* Chop off the country code from the full language specifier. */
    const code = lang.replace(/-[a-zA-Z]*$/, '');

    try {
        response = yield call(jsonGet, `${baseUrl}/examples.json?lang=${code}`);
    } catch (ex) {
        yield put({type: actionTypes.examplesLoadFailed, payload: {error: ex}});
        return;
    }

    yield put({type: actionTypes.examplesLoadSucceeded, payload: response});
}

function* useExample({payload: {example}}) {
    const {options: {callbackUrl, target}} = yield select(state => state);

    const exampleUrl = url.parse(callbackUrl, true);

    delete exampleUrl.search;

    exampleUrl.query.source = example.source;
    if (example.platform) {
        exampleUrl.query.platform = example.platform;
    }

    /* Consider: also pass: selection, input */
    window.open(url.format(exampleUrl), target);
}

export default {
    actionTypes: {
        appInitialized: 'App.Inititalized',
        appStarted: 'App.Started',
        appCrashed: 'App.Crashed',
        examplesLoadSucceeded: 'Examples.Load.Succeeded',
        examplesLoadFailed: 'Examples.Load.Failed',
        exampleSelected: 'Example.Selected',
        exampleUsed: 'Example.Used',
        tagFilterChanged: 'TagFilter.Changed',
    },
    actionReducers: {
        appInitialized: appInitializedReducer,
        appStarted: appStartedReducer,
        appCrashed: appCrashedReducer,
        examplesLoadSucceeded: examplesLoadSucceededReducer,
        examplesLoadFailed: examplesLoadFailedReducer,
        exampleSelected: exampleSelectedReducer,
        tagFilterChanged: tagFilterChangedReducer,
    },
    lateReducer: lateReducer,
    views: {
        App: connect(AppSelector)(App)
    },
    saga: appSaga,
    includes: [I18nBundle]
}

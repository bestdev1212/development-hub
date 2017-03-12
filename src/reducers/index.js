import { Map } from 'immutable';
import { combineReducers } from 'redux-immutable';

import app from './app';
import config from './config';
import entities from './entities';
import firebase from './firebase';
import navigation from './navigation';
import notifications from './notifications';
import user from './user';

import {
  FIREBASE_RECEIVED_EVENT,
  RESET_APP_DATA,
} from '../utils/constants/actions';
import type { Action } from '../utils/types';

const reducer = combineReducers({
  app,
  config,
  entities,
  // firebase,
  navigation,
  notifications,
  user,
});

const initialState = Map();

const indexReducer = (state: Object = initialState, action) => {
  const { type } = action || {};

  switch (type) {
    case FIREBASE_RECEIVED_EVENT:
      return firebase(state, action);

    case RESET_APP_DATA:
      return initialState;

    default:
      return state;
  }
};

export default (state: Object = initialState, action: Action<Object>) => {
  const stateAfterIndexReducer = indexReducer(state, action);
  return reducer(stateAfterIndexReducer, action);
};

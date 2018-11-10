import immer from 'immer'
import _ from 'lodash'

import { ColumnSubscription, Reducer } from '../../types'

export interface State {
  allIds: string[]
  byId: Record<string, ColumnSubscription>
}

const initialState: State = {
  allIds: [],
  byId: {},
}

export const subscriptionsReducer: Reducer<State> = (
  state = initialState,
  action,
) => {
  switch (action.type) {
    case 'ADD_COLUMN':
      return immer(state, draft => {
        draft.allIds = draft.allIds || []

        draft.byId = draft.byId || {}
        const subscriptionIds = action.payload.subscriptions.map(s => {
          draft.byId[s.id] = {
            ...(s as any), // TODO: fix any
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          return s.id
        })

        draft.allIds = _.uniq(draft.allIds.concat(subscriptionIds)).filter(
          Boolean,
        )
      })

    case 'REPLACE_COLUMNS':
      return immer(state, draft => {
        draft.allIds = []
        draft.byId = {}

        action.payload.forEach(p => {
          p.subscriptions.forEach(s => {
            draft.allIds.push(s.id)

            draft.byId[s.id] = {
              ...(s as any), // TODO: Fix any
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          })
        })
      })

    default:
      return state
  }
}

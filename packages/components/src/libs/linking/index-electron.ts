// Source: https://github.com/PaulLeCam/react-native-electron/blob/master/src/apis/Linking.js

import _ from 'lodash'

import { LinkingCrossPlatform } from './index'
import { Linking as LinkingOriginal } from './index-native'

const eventHandlers = new Map()

export const Linking: LinkingCrossPlatform = {
  addEventListener: (type: string, handler: any) => {
    if (!(type === 'url' && typeof handler === 'function')) return

    const wrapHandler = (_e: any, url: string) => {
      handler({ type, url })
    }

    eventHandlers.set(handler, wrapHandler)
    window.ipc.addListener('open-url', wrapHandler)
  },
  async canOpenURL(url: string) {
    return LinkingOriginal.canOpenURL(url)
  },
  async getInitialURL() {
    return ''
  },
  openURL: (url: string): Promise<void> => {
    return LinkingOriginal.openURL(url)
  },
  removeEventListener: (type: string, handler: any) => {
    if (!(type === 'url' && typeof handler === 'function')) return

    const wrapHandler = eventHandlers.get(handler)
    if (wrapHandler) {
      window.ipc.removeListener('open-url', wrapHandler)
    }

    eventHandlers.delete(handler)
  },
}

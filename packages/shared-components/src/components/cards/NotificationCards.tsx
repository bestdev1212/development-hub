import React, { PureComponent } from 'react'
import { FlatList, View } from 'react-native'

import { GitHubNotification } from 'shared-core/dist/types'
import { ErrorBoundary } from '../../libs/bugsnag'
import { contentPadding } from '../../styles/variables'
import { Button } from '../common/Button'
import { TransparentTextOverlay } from '../common/TransparentTextOverlay'
import { ThemeConsumer } from '../context/ThemeContext'
import { NotificationCard } from './NotificationCard'
import { CardItemSeparator } from './partials/CardItemSeparator'
import { SwipeableNotificationCard } from './SwipeableNotificationCard'

export interface NotificationCardsProps {
  fetchNextPage: ((params?: { perPage?: number }) => void) | undefined
  notifications: GitHubNotification[]
  repoIsKnown?: boolean
  swipeable?: boolean
}

export interface NotificationCardsState {}

export class NotificationCards extends PureComponent<
  NotificationCardsProps,
  NotificationCardsState
> {
  keyExtractor(notification: GitHubNotification) {
    return `notification-card-${notification.id}`
  }

  renderItem = ({ item: notification }: { item: GitHubNotification }) => {
    if (this.props.swipeable) {
      return (
        <SwipeableNotificationCard
          notification={notification}
          repoIsKnown={this.props.repoIsKnown}
        />
      )
    }

    return (
      <ErrorBoundary>
        <NotificationCard
          notification={notification}
          repoIsKnown={this.props.repoIsKnown}
        />
      </ErrorBoundary>
    )
  }

  renderFooter = () => {
    const { fetchNextPage } = this.props

    if (!fetchNextPage) return null

    return (
      <View style={{ padding: contentPadding }}>
        <Button onPress={() => fetchNextPage()} children="Load more" />
      </View>
    )
  }

  render() {
    const { notifications } = this.props
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <TransparentTextOverlay
            color={theme.backgroundColor}
            size={contentPadding}
            from="vertical"
          >
            <FlatList
              key="notification-cards-flat-list"
              ItemSeparatorComponent={CardItemSeparator}
              ListFooterComponent={this.renderFooter}
              data={notifications}
              keyExtractor={this.keyExtractor}
              removeClippedSubviews
              renderItem={this.renderItem}
            />
          </TransparentTextOverlay>
        )}
      </ThemeConsumer>
    )
  }
}

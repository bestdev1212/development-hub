import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { EnhancedItem, isItemRead } from '@devhub/core'
import { SwipeableRow } from '../../libs/swipeable'
import * as actions from '../../redux/actions'
import { getCardBackgroundThemeColor } from '../columns/ColumnRenderer'
import { useTheme } from '../context/ThemeContext'
import { CardWithLink, CardWithLinkProps } from './CardWithLink'

export interface SwipeableCardProps<ItemT extends EnhancedItem>
  extends CardWithLinkProps<ItemT> {}

export function SwipeableCard<ItemT extends EnhancedItem>(
  props: CardWithLinkProps<ItemT>,
) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const isRead = isItemRead(props.item)

  function handleMarkAsRead() {
    dispatch(
      actions.markItemsAsReadOrUnread({
        type: props.type,
        itemIds: [props.item.id],
        localOnly: false,
        unread: isRead,
      }),
    )
  }

  function handleSave() {
    dispatch(
      actions.saveItemsForLater({
        itemIds: [props.item.id],
        save: !props.item.saved,
      }),
    )
  }

  const Content = useMemo(() => <CardWithLink {...props} isInsideSwipeable />, [
    props.cachedCardProps,
    props.columnId,
    props.item,
    props.ownerIsKnown,
    props.repoIsKnown,
    props.type,
  ])

  return (
    <SwipeableRow
      leftActions={[
        {
          color:
            theme[
              getCardBackgroundThemeColor({
                isDark: theme.isDark,
                isMuted: !isRead,
              })
            ],
          icon: isRead ? 'mail' : 'mail-read',
          key: 'read',
          label: 'Read',
          onPress: handleMarkAsRead,
          type: 'FULL',
        },
      ]}
      rightActions={[
        {
          color: props.item.saved
            ? theme.backgroundColorDarker2
            : theme.primaryBackgroundColor,
          icon: 'bookmark',
          key: 'bookmark',
          label: 'Bookmark',
          onPress: handleSave,
          type: 'FULL',
        },
      ]}
    >
      {Content}
    </SwipeableRow>
  )
}

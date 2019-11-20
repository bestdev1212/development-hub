import {
  constants,
  formatPriceAndInterval,
  Plan,
  UserPlan,
  isPlanStatusValid,
} from '@brunolemos/devhub-core'
import classNames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { CardElement, injectStripe } from 'react-stripe-elements'

import { constants, Plan, UserPlan } from '@brunolemos/devhub-core'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import {
  formatPrice,
  formatPriceAndInterval,
  getDefaultDevHubHeaders,
} from '../../../helpers'
import Button from '../../common/buttons/Button'

export interface SubscribeFormProps {
  plan: Plan
  onSuccess: () => void
}

export const SubscribeForm = injectStripe<SubscribeFormProps>(
  // tslint:disable-next-line ter-prefer-arrow-callback no-shadowed-variable
  function SubscribeForm(props) {
    const { children, onSuccess, plan, stripe } = props

    const isMountedRef = useRef(true)
    const [isCardFilled, setIsCardFilled] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [formState, setFormState] = useState<{
      error: string | undefined
      isSubmiting: boolean
    }>({
      error: undefined,
      isSubmiting: false,
    })

    const { theme } = useTheme()
    const { authData, logout, mergeAuthData } = useAuth()

    useEffect(() => {
      isMountedRef.current = true

      return () => {
        isMountedRef.current = false
      }
    }, [])

    async function handleSubmit() {
      if (!(isCardFilled && stripe)) return

      let cardToken
      try {
        setFormState({ error: undefined, isSubmiting: true })
        const { error, token } = await stripe.createToken()

        if (!isMountedRef.current) return

        if (error) {
          console.error(error)
          setFormState({
            error: `Failed to create Stripe card token: ${error.message}`,
            isSubmiting: false,
          })
          return false
        }

        if (!token) {
          setFormState({
            error: 'Failed to create Stripe card token. No token received.',
            isSubmiting: false,
          })
          return false
        }

        cardToken = token.id
      } catch (error) {
        console.error(error)
        setFormState({
          error: `Failed to create Stripe card token. Error: ${error.message}`,
          isSubmiting: false,
        })
        return false
      }

      try {
        const response = await fetch(constants.GRAPHQL_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify({
            query: `
              mutation($input: PlanSubscriptionInput) {
                subscribeToPlan(input: $input) {
                  id
                  source

                  amount
                  currency
                  trialPeriodDays
                  interval
                  intervalCount

                  status

                  startAt
                  cancelAt
                  cancelAtPeriodEnd

                  trialStartAt
                  trialEndAt

                  currentPeriodStartAt
                  currentPeriodEndAt

                  reason

                  featureFlags {
                    columnsLimit
                    enableFilters
                    enableSync
                    enablePrivateRepositories
                    enablePushNotifications
                  }

                  createdAt
                  updatedAt
                }
              }`,
            variables: {
              input: {
                planId: plan.id,
                cardToken,
              },
            },
          }),
          headers: {
            ...getDefaultDevHubHeaders({ appToken: authData.appToken }),
            'Content-Type': 'application/json',
          },
        })

        if (!isMountedRef.current) return

        if (response.status === 401) {
          setFormState({
            error: 'Please login again.',
            isSubmiting: false,
          })

          logout()
          return false
        }

        const { data, errors } = (await response.json()) as {
          data: { subscribeToPlan: UserPlan | null } | null
          errors: any[] | null
        }

        if (!(data && data.subscribeToPlan) || (errors && errors[0])) {
          throw new Error(
            (errors && errors[0] && errors[0].message) ||
              'Something went wrong',
          )
        }

        setFormState({
          error: undefined,
          isSubmiting: false,
        })

        mergeAuthData({ plan: data.subscribeToPlan })

        if (
          !isPlanStatusValid(data.subscribeToPlan) ||
          data.subscribeToPlan.status === 'incomplete'
        ) {
          throw new Error('Please try a different credit card.')
        }

        if (onSuccess) onSuccess()
        return true
      } catch (error) {
        console.error(error)
        setFormState({
          error:
            `Failed to execute payment. ${error.message}` +
            "\n\nAlso, please note we currently don't support Amex, Elo or Debit cards.",
          isSubmiting: false,
        })
        return false
      }
    }

    return (
      <form
        className="flex flex-col items-center w-full md:w-2/3 lg:w-150 m-auto"
        onSubmit={handleSubmit}
      >
        <div
          className={`self-stretch mb-3 bg-more-3 border rounded-full overflow-hidden${
            isFocused ? ' shadow-md border-primary' : ' border-bg-less-3 shadow'
          }`}
          style={{ minHeight: 51 }}
        >
          <CardElement
            className="self-stretch py-4 px-4"
            onBlur={() => setIsFocused(false)}
            onChange={e => {
              if (e.complete !== isCardFilled) setIsCardFilled(e.complete)
            }}
            onFocus={() => setIsFocused(true)}
            style={{
              base: {
                color: theme.foregroundColor,
                '::placeholder': {
                  color: theme.foregroundColorMuted65,
                },
                iconColor: theme.foregroundColor,
              },
              invalid: {
                color: theme.red,
                iconColor: theme.red,
              },
            }}
          />
        </div>

        <p className="mb-8 text-sm text-muted-65 italic">
          🔒 Payment secured by{' '}
          <a href="https://stripe.com/" target="_blank" rel="noopener">
            Stripe
          </a>
          {process.env.STRIPE_PUBLIC_KEY!.startsWith('pk_test') && (
            <span className="text-red"> (test mode)</span>
          )}
        </p>

        <Button
          type="primary"
          className="mb-4"
          disabled={!isCardFilled}
          loading={formState.isSubmiting}
          onClick={handleSubmit}
        >
          {`Subscribe for ${formatPriceAndInterval(plan.amount, plan)}`}
        </Button>

        {!!(
          plan.amount &&
          !plan.trialPeriodDays &&
          (!(authData.plan && authData.plan.amount) ||
            (authData.plan.amount && plan.amount > authData.plan.amount))
        ) && (
          <p className="mb-4 text-xs text-muted-65">
            {authData.plan && authData.plan.amount
              ? 'Your card will be charged any difference immediately'
              : 'Your card will be charged immediately'}
          </p>
        )}

        {!!formState.error && (
          <p className="mb-4 text-sm text-red italic">{formState.error}</p>
        )}

        {children}
      </form>
    )
  },
)

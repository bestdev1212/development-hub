// @flow
/* eslint-disable import/prefer-default-export */

import gravatar from 'gravatar';
import max from 'lodash/max';
import moment from 'moment';
import { fromJS, List, Map } from 'immutable';

import type {
    GithubEvent,
    GithubEventType,
    GithubIcon,
    GithubNotification,
    GithubNotificationReason,
  } from '../types/github';

export function getEventIcon(event: GithubEvent): GithubIcon {
  const eventType = event.get('type').split(':')[0];
  const payload = event.get('payload');

  switch (eventType) {
    case 'CommitCommentEvent': return 'comment-discussion'; // git-commit
    case 'CreateEvent':
      switch (payload.get('ref_type')) {
        case 'repository': return 'repo';
        case 'branch': return 'git-branch';
        case 'tag': return 'tag';
        default: return 'plus';
      }
    case 'DeleteEvent':
      switch (payload.get('ref_type')) {
        case 'repository': return 'repo'; // probably not used
        case 'branch': return 'git-branch';
        case 'tag': return 'tag';
        default: return 'trashcan';
      }
    case 'GollumEvent': return 'book';
    case 'ForkEvent': return 'repo-forked';
    case 'IssueCommentEvent': return 'comment-discussion';
    case 'IssuesEvent':
      switch (payload.get('action')) {
        case 'closed': return 'issue-closed';
        case 'reopened': return 'issue-reopened';
        // case 'opened':
        // case 'assigned':
        // case 'unassigned':
        // case 'labeled':
        // case 'unlabeled':
        // case 'edited':
        // case 'milestoned':
        // case 'demilestoned':
        default: return 'issue-opened';
      }
    case 'MemberEvent': return 'person';
    case 'PublicEvent': return 'repo';
    case 'PullRequestEvent': return 'git-pull-request';
    case 'PullRequestReviewEvent':
    case 'PullRequestReviewCommentEvent': return 'comment-discussion';
    case 'PushEvent': return 'code';
    case 'ReleaseEvent': return 'tag';
    case 'WatchEvent': return 'star';
    default: return 'mark-github';
  }
}

export function getNotificationIcon(notification: GithubNotification): GithubIcon {
  const type = notification.getIn(['subject', 'type']).toLowerCase();

  switch (type) {
    case 'commit': return 'git-commit';
    case 'issue': return 'issue-opened';
    case 'pullrequest': return 'git-pull-request';
    default: return 'bell';
  }
}

type GetEventTextOptions = { issueIsKnown: ?boolean, repoIsKnown: ?boolean };
export function getEventText(event: GithubEvent, options: ?GetEventTextOptions): string {
  const eventType = event.get('type');
  const payload = event.get('payload');

  const { issueIsKnown, repoIsKnown } = options || {};

  const issueText = issueIsKnown ? 'this issue' : 'an issue';
  const repositoryText = repoIsKnown ? 'this repository' : 'a repository';

  const text = (() => {
    switch (eventType) {
      case 'CommitCommentEvent': return 'commented on a commit';
      case 'CreateEvent':
        switch (payload.get('ref_type')) {
          case 'repository': return `created ${repositoryText}`;
          case 'branch': return 'created a branch';
          case 'tag': return 'created a tag';
          default: return 'created something';
        }
      case 'DeleteEvent':
        switch (payload.get('ref_type')) {
          case 'repository': return `deleted ${repositoryText}`;
          case 'branch': return 'deleted a branch';
          case 'tag': return 'deleted a tag';
          default: return 'deleted something';
        }
      case 'GollumEvent':
        return (() => {
          const count = (payload.get('pages') || List([])).size || 1;
          const pagesText = count > 1 ? `${count} wiki pages` : 'a wiki page';
          switch (((payload.get('pages') || List([]))[0] || Map()).get('action')) {
            case 'created': return `created ${pagesText}`;
            default: return `updated ${pagesText}`;
          }
        })();
      case 'ForkEvent': return `forked ${repositoryText}`;
      case 'IssueCommentEvent': return `commented on ${issueText}`;
      case 'IssuesEvent': // TODO: Fix these texts
        switch (payload.get('action')) {
          case 'closed': return `closed ${issueText}`;
          case 'reopened': return `reopened ${issueText}`;
          case 'opened': return `opened ${issueText}`;
          case 'assigned': return `assigned ${issueText}`;
          case 'unassigned': return `unassigned ${issueText}`;
          case 'labeled': return `labeled ${issueText}`;
          case 'unlabeled': return `unlabeled ${issueText}`;
          case 'edited': return `edited ${issueText}`;
          case 'milestoned': return `milestoned ${issueText}`;
          case 'demilestoned': return `demilestoned ${issueText}`;
          default: return `interacted with ${issueText}`;
        }
      case 'MemberEvent': return `added an user ${repositoryText && `to ${repositoryText}`}`;
      case 'PublicEvent': return `made ${repositoryText} public`;
      case 'PullRequestEvent':
        switch (payload.get('action')) {
          case 'assigned': return 'assigned a pr';
          case 'unassigned': return 'unassigned a pr';
          case 'labeled': return 'labeled a pr';
          case 'unlabeled': return 'unlabeled a pr';
          case 'opened': return 'opened a pr';
          case 'edited': return 'edited a pr';
          case 'closed': return 'closed a pr';
          case 'reopened': return 'reopened a pr';
          default: return 'interacted with a pr';
        }
      case 'PullRequestReviewEvent': return 'reviewed a pr';
      case 'PullRequestReviewCommentEvent':
        switch (payload.get('action')) {
          case 'created': return 'commented on a pr review';
          case 'edited': return 'edited a pr review';
          case 'deleted': return 'deleted a pr review';
          default: return 'interacted with a pr review';
        }
      case 'PushEvent':
        return (() => {
          const commits = payload.get('commits') || List([Map()]);
          // const commit = payload.get('head_commit') || commits[0];
          const count = max([1, payload.get('size'), payload.get('distinct_size'), commits.size]) || 1;
          const branch = (payload.get('ref') || '').split('/').pop();

          const pushedText = payload.get('forced') ? 'force pushed' : 'pushed';
          const commitText = count > 1 ? `${count} commits` : 'a commit';
          const branchText = branch === 'master' ? `to ${branch}` : '';

          return `${pushedText} ${commitText} ${branchText}`;
        })();
      case 'ReleaseEvent': return 'published a release';
      case 'WatchEvent': return `starred ${repositoryText}`;
      case 'WatchEvent:OneRepoMultipleUsers':
        return (() => {
          const otherUsers = payload.get('users');
          const otherUsersText = otherUsers && otherUsers.size > 0
            ? (otherUsers.size > 1 ? `and ${otherUsers.size} others` : 'and 1 other')
            : '';

          return `${otherUsersText} starred ${repositoryText}`;
        })();
      case 'WatchEvent:OneUserMultipleRepos':
        return (() => {
          const otherRepos = payload.get('repos');
          const count = (otherRepos && otherRepos.size) || 0;

          return count > 1 ? `starred ${count} repositories` : `starred ${repositoryText}`;
        })();
      default: return 'did something';
    }
  })();

  return text.replace(/ {2}/g, ' ').trim();
}

export function getNotificationReasonText(notification: GithubNotification): string {
  const reason: GithubNotificationReason = notification.get('reason');
  switch (reason) {
    case 'assign': return 'you were assigned to this issue';
    case 'author': return 'you created the thread';
    case 'comment': return 'you commented on the thread';
    case 'invitation': return 'you accepted an invitation to contribute to the repository';
    case 'manual': return 'you subscribed to the thread';
    case 'mention': return 'you were @mentioned';
    case 'state_change': return 'you changed the thread state';
    case 'subscribed': return 'you\'re watching this repository';
    case 'team_mention': return 'your team was mentioned';
    default: return '';
  }
}

export function getOwnerAndRepo(repoFullName: string): { owner: ?string, repo: ?string} {
  const repoSplitedNames = (repoFullName || '').trim().split('/').filter(Boolean);

  const owner = (repoSplitedNames[0] || '').trim();
  const repo = (repoSplitedNames[1] || '').trim();

  return { owner, repo };
}

export function mergeSimilarEvents(events: Array<GithubEvent>) {
  let hasMerged = false;

  const tryMergeEvents = (eventA: GithubEvent, eventB: GithubEvent) => {
    if (!eventA || !eventB) return null;

    const typeA: GithubEventType = eventA.get('type');
    const typeB: GithubEventType = eventB.get('type');

    const isSameRepo = eventA.getIn(['repo', 'id']) === eventB.getIn(['repo', 'id']);
    const isSameUser = eventA.getIn(['actor', 'id']) === eventB.getIn(['actor', 'id']);
    const createdAtMinutesDiff = moment(eventA.get('created_at')).diff(moment(eventB.get('created_at')), 'minutes');
    // const merged = eventA.get('merged') || List();

    // only merge events that were created in the same hour
    if (createdAtMinutesDiff >= 60) return null;

    // only merge 5 items max
    // if (merged.size >= 5 - 1) return null;

    switch (typeA) {
      case 'WatchEvent':
        return (() => {
          switch (typeB) {
            case 'WatchEvent':
              return (() => {
                if (isSameRepo) {
                  return eventA.mergeDeep(fromJS({
                    type: 'WatchEvent:OneRepoMultipleUsers',
                    payload: {
                      users: [eventB.get('actor')],
                    },
                  }));
                } else if (isSameUser) {
                  return eventA.mergeDeep(fromJS({
                    type: 'WatchEvent:OneUserMultipleRepos',
                    repo: null,
                    payload: {
                      repos: [eventA.get('repo'), eventB.get('repo')],
                    },
                  }));
                }

                return null;
              })();

            default:
              return null;
          }
        })();

      case 'WatchEvent:OneRepoMultipleUsers':
        return (() => {
          switch (typeB) {
            case 'WatchEvent':
              return (() => {
                if (isSameRepo) {
                  const users = eventA.getIn(['payload', 'users']) || List();
                  const newUser = eventB.getIn(['actor']);

                  const alreadyMergedThisUser = users.find(mergedUser => (
                    `${mergedUser.get('id')}` === `${newUser.get('id')}`
                  ));

                  if (!alreadyMergedThisUser) {
                    const newUsers = users.push(newUser);
                    return eventA.setIn(['payload', 'users'], newUsers);
                  }

                  return null;
                }

                return null;
              })();

            default:
              return null;
          }
        })();

      case 'WatchEvent:OneUserMultipleRepos':
        return (() => {
          switch (typeB) {
            case 'WatchEvent':
              return (() => {
                if (isSameUser) {
                  const repos = eventA.getIn(['payload', 'repos']) || List();
                  const newRepo = eventB.getIn(['repo']);

                  const alreadyMergedThisRepo = repos.find(mergedRepo => (
                    `${mergedRepo.get('id')}` === `${newRepo.get('id')}`
                  ));

                  if (!alreadyMergedThisRepo) {
                    const newRepos = repos.push(newRepo);
                    return eventA.setIn(['payload', 'repos'], newRepos);
                  }

                  return null;
                }

                return null;
              })();

            default:
              return null;
          }
        })();

      default: return null;
    }
  };

  const accumulator = (newEvents: Array<GithubEvent>, event: GithubEvent) => {
    const lastEvent = newEvents.last();
    const mergedLastEvent = tryMergeEvents(lastEvent, event);

    if (mergedLastEvent) {
      hasMerged = true;

      let allMergedEvents = mergedLastEvent.get('merged') || List();
      allMergedEvents = allMergedEvents.push(event);

      const mergedLastEventUpdated = mergedLastEvent.set('merged', allMergedEvents);
      return newEvents.set(-1, mergedLastEventUpdated);
    }

    return newEvents.push(event);
  };

  const newEvents = events.reduce(accumulator, List());
  return hasMerged ? newEvents : events;
}

export function getOrgAvatar(orgName: string) {
  return orgName ? `https://github.com/${orgName}.png` : '';
}

export function getUserAvatar(userName: string) {
  return userName ? `https://github.com/${userName}.png` : '';
}

export function tryGetUsernameFromGithubEmail(email: string) {
  if (!email) return '';

  const emailSplit = email.split('@');
  if (emailSplit.length === 2 && emailSplit[1] === 'users.noreply.github.com') return emailSplit[0];

  return '';
}

export function getUserAvatarByEmail(email: string, { size, ...otherOptions }: { size?: number }) {
  const sizeSteps = 50; // sizes will be multiples of 50 for caching (e.g 50, 100, 150, ...)
  const steppedSize = !size ? sizeSteps : sizeSteps * Math.max(1, Math.ceil(size / sizeSteps));

  const username = tryGetUsernameFromGithubEmail(email);
  if (username) return getUserAvatar(username);

  const options = { size: steppedSize, d: 'retro', ...otherOptions };
  return `https:${gravatar.url(email, options)}`.replace('??', '?');
}

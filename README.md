# EasyMatching

EasyMatching is an interest-based dating and chat platform that supports multiple OAuth logins, custom user IDs, one-on-one/group chat rooms, and real-time matching recommendations.

## Core Features

- **Authentication**
  - Google, GitHub, Facebook OAuth
  - First-time registration requires setting a unique `userID`, which can be used for quick login later
  - Login history is stored in the browser for one-click account switching
- **Profile**
  - Edit username, avatar, and bio (max 100 characters)
  - Complete onboarding by selecting interest tags
  - **[NEW] Account Management**: View and restore users who were Passed or Unmatched
- **Matching & Recommendations**
  - Recommend users based on common interests, displaying basic info, bio, and shared/other interests
  - Support search by `userID` or username
  - **Like/Pass**: Swipe left to Pass, swipe right to Like. A match is formed when both users like each other
  - **Real-time Notifications**: Notification count in the navigation bar updates immediately when receiving a Like
- **Likes List**
  - View who liked you, with options to Like back (Match) or Pass
- **Chat Room**
  - Left sidebar lists all conversations, supporting one-on-one and group chats
  - **Real-time Messaging**: Integrated with Pusher for instant message delivery
  - **Conversation Management**:
    - **Unmatch**: The other party will no longer be able to send messages, and the chat moves to the "Unmatched" list
    - **Delete**: Only deletes the chat history on your side (Soft Delete); the other party retains the chat
    - **Report**: Report users for harassment or inappropriate behavior

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Material UI (MUI v7)
- **Backend**: Next.js API Routes
- **Database**: MongoDB, Prisma ORM
- **Auth**: NextAuth.js (Google, GitHub, Facebook)
- **Real-time**: Pusher
- **State Management/Data Fetching**: SWR, Axios

## Setup

1. Copy `.env.example` to `.env.local` and fill in the actual values (MongoDB, NextAuth, OAuth, Pusher).
2. Install dependencies, generate Prisma Client, and push schema:

```bash
yarn install
yarn prisma:generate
yarn prisma:push
yarn prisma:seed
```

3. Start locally:

```bash
yarn dev
```

To start MongoDB simultaneously (if using local Docker), you can run `./start-all.sh`.

## Key APIs

- **Matching**
  - `GET /api/matching?search=`：Get recommended users and common interests
  - `POST /api/matching/swipe`：Perform LIKE or PASS action
  - `GET /api/matching/likes`：Get list of users who liked me
- **Conversation**
  - `POST /api/conversations`：Create or get one-on-one/group conversation
  - `POST /api/conversations/[id]/unmatch`：Unmatch user
  - `POST /api/conversations/[id]/delete`：Delete conversation (Soft Delete)
- **User**
  - `GET/PUT /api/user`：Get and update profile
  - `GET/PUT /api/user/hobbies`：Get and update interest tags
  - `GET /api/user/likes/count`：Get unread like notification count
  - `GET /api/user/ignored`：Get ignored/unmatched users
  - `POST /api/user/ignored/restore`：Restore ignored user to matching pool

## Test & Build

- Linting: `yarn lint`
- Build for production: `yarn build`

## Development Notes

- **SessionTracker**: Stores userID and display name in the browser after successful login for quick switching on the login page.
- **Soft Delete**: Conversation deletion uses Soft Delete (`isDeleted` flag) to ensure that when one party deletes the chat, the other party still retains the chat history and user info (preventing "Unnamed Conversation" issues).
- **Ignored Users**: "Ignored" includes users who were actively PASSed, Unmatched, or whose conversation was Deleted. These users can be restored via the management feature in the Profile page.

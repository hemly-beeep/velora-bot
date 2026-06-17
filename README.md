# Velora — Advanced Discord Moderation Bot

A fully-featured Discord moderation bot built with discord.js v14, MongoDB/Mongoose, TypeScript, and Express.

## Features

- 100+ commands via both `/slash` and `??prefix`
- Moderation: ban, unban, kick, mute, warn, timeout, purge, lockdown, and more
- Auto-moderation: anti-spam, anti-link, anti-invite, caps filter, mention spam
- Anti-nuke & Anti-raid protection
- Ticket system with panel
- Reaction roles
- Invite tracking
- Case management & mod logs
- Tags, polls, schedules
- Battle (PvP) system
- Welcome/goodbye messages with canvas banners
- Reaction commands: hug, pat, kiss, slap, bonk, yeet, and more
- Every response has a Close button; every button has a user-guard

## Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Discord**: discord.js v14
- **Database**: MongoDB + Mongoose
- **Canvas**: @napi-rs/canvas
- **Scheduler**: node-cron
- **Keep-alive**: Express

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd velora-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in DISCORD_TOKEN, CLIENT_ID, MONGO_URI
```

### 3. Build

```bash
npm run build
```

### 4. Deploy slash commands

```bash
npm run deploy
```

### 5. Start

```bash
npm start
```

## Environment Variables

| Variable        | Description                          |
|-----------------|--------------------------------------|
| `DISCORD_TOKEN` | Your bot token from Discord Dev Portal |
| `CLIENT_ID`     | Your application's client ID         |
| `MONGO_URI`     | MongoDB Atlas connection string      |
| `SESSION_SECRET`| Optional internal secret             |

## Hosting on Render (Free Tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service (or use the `render.yaml` file for automatic setup)
3. Connect your GitHub repo
4. Set the following environment variables in Render dashboard:
   - `DISCORD_TOKEN` → your bot token
   - `CLIENT_ID` → your client ID
   - `MONGO_URI` → your MongoDB URI
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. **Important**: Set service type to **Background Worker** (not Web Service) for a bot — or use the `render.yaml` which handles this automatically.

> **Free tier note**: Render free tier spins down after 15 minutes of inactivity. The bot includes an Express keep-alive server at `/` and `/health`. You can use [UptimeRobot](https://uptimerobot.com) (free) to ping your Render URL every 5 minutes to prevent spin-down.

## Commands Overview

| Category     | Commands |
|--------------|----------|
| Moderation   | ban, unban, kick, mute, warn, warnings, clearwarn, softban, timeout, lock, purge, nick, role, massban, masskick, strip, hide, nuke, clone, pin, announce, lockdown, dehoist |
| Cases        | case, cases, history, editreason, modstats |
| Notes        | note, notes, deletenote |
| Watchlist    | watchlist |
| AutoMod      | automod, badwords |
| Protection   | antiraid, antinuke, panic, globalban |
| Logging      | setlogs, logs |
| Settings     | settings, setprefix, setrole, welcome |
| Verification | verification |
| ReactionRoles| reactionroles |
| Tickets      | ticket |
| Battle       | battle |
| Invites      | invites, inviteleaderboard, inviteadd |
| Tags         | tag |
| Schedule     | schedule |
| Roles        | temprole, rolemember |
| Channels     | createchannel, deletechannel, renamechannel |
| Emoji        | emojiadd, emojidelete |
| Messages     | snipe, editsnipe, say, move |
| Advanced     | backup, poll |
| Info         | userinfo, serverinfo, botinfo, roleinfo, channelinfo |
| Extra        | avatar, ping, membercount |
| Reactions    | hug, pat, kiss, slap, bite, poke, wave, highfive, dance, cry, laugh, blush, bonk, yeet, shrug, stare, nod, facepalm, punch, lick, tickle |

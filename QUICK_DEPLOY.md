# 🚀 Quick Deploy Guide - DUOQ Tracker

## ✅ Pre-requisites Checklist

- [x] Build successful (0 TypeScript errors)
- [x] Tests passing (461/461)
- [x] All features implemented
- [x] PM2 installed globally
- [ ] Environment variables configured
- [ ] Discord bot token ready
- [ ] Riot API key ready

---

## 📦 Step 1: Build the Project

```bash
cd /home/afc/Desktop/LePacte/DUOQ-Tracker
npm run build
```

**Expected output:**
```
> duoq-tracker@0.1.0 build
> tsc
```

✅ No errors = build successful!

---

## ⚙️ Step 2: Configure Environment

Create or update `.env` file:

```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
GUILD_ID=your_server_id_here
ADMIN_ROLE_ID=your_admin_role_id_here
DEV_CHANNEL_ID=your_dev_channel_id_here
GENERAL_CHANNEL_ID=your_general_channel_id_here
TRACKER_CHANNEL_ID=your_tracker_channel_id_here

# Riot API
RIOT_API_KEY=RGAPI-your-key-here
RIOT_REGION=EUW1

# Challenge Config
CHALLENGE_START_DATE=2024-01-01
CHALLENGE_END_DATE=2024-12-31
GAME_CHECK_INTERVAL=60000
MAX_GAMES_PER_CHECK=10

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🚀 Step 3: Start with PM2

### Option A: Production Mode (Recommended)

Uses compiled code from `dist/`:

```bash
cd /home/afc/Desktop/LePacte/DUOQ-Tracker
pm2 start ecosystem.config.cjs --env production
```

### Option B: Development Mode

Uses `tsx` to run TypeScript directly:

```bash
pm2 start ecosystem.config.cjs
```

---

## 🔍 Step 4: Verify Deployment

### Check Status
```bash
pm2 status
```

**Expected output:**
```
┌────┬──────────────┬─────────┬───┬──────┬──────────┐
│ id │ name         │ status  │ ↺ │ cpu  │ memory   │
├────┼──────────────┼─────────┼───┼──────┼──────────┤
│ 0  │ duoq-tracker │ online  │ 0 │ 0%   │ 50.2mb   │
└────┴──────────────┴─────────┴───┴──────┴──────────┘
```

✅ `status: online` and `↺ 0` (no restarts) = healthy!

### Check Logs
```bash
pm2 logs duoq-tracker --lines 50
```

**Expected output:**
```
✅ Discord bot logged in as YourBot#1234
✅ GameTracker started
✅ Daily ladder scheduler started
```

---

## 🛠️ Common Commands

### View Logs (Live)
```bash
pm2 logs duoq-tracker
```

### View Logs (Last 100 lines)
```bash
pm2 logs duoq-tracker --lines 100 --nostream
```

### Restart Bot
```bash
pm2 restart duoq-tracker
```

### Stop Bot
```bash
pm2 stop duoq-tracker
```

### Delete from PM2
```bash
pm2 delete duoq-tracker
```

### Save PM2 Configuration
```bash
pm2 save
```

### Auto-start on System Boot
```bash
pm2 startup
# Then run the command it outputs (with sudo)
```

---

## 🐛 Troubleshooting

### Bot Keeps Restarting (↺ > 0)

**Check logs:**
```bash
pm2 logs duoq-tracker --err --lines 50
```

**Common issues:**
- ❌ Missing environment variables → Check `.env`
- ❌ Invalid Discord token → Regenerate token
- ❌ Invalid Riot API key → Get new key
- ❌ Missing `dist/` folder → Run `npm run build`
- ❌ Wrong working directory → Check `cwd` in ecosystem.config.cjs

### Build Failed

**Check TypeScript errors:**
```bash
npm run build
```

**Run tests:**
```bash
npm test
```

### Port Already in Use

Discord bots don't use ports, but if you have issues:
```bash
pm2 delete duoq-tracker
pm2 start ecosystem.config.cjs --env production
```

---

## 📊 Health Check

Once deployed, verify features work:

### Discord Commands
1. `/setup` - Configure channels
2. `/register <name#tag> <role> <champion> <peakElo>` - Register player
3. `/link` - Create duo
4. `/ladder` - View rankings
5. `/profile` - View stats

### GameTracker
- Bot should detect games automatically
- Check tracker channel for game notifications
- Verify scoring after games complete

### Daily Ladder
- Scheduled to post at configured time
- Check tracker channel

---

## 🎯 Production Checklist

- [ ] Bot status: `online` ✅
- [ ] No restarts (↺ = 0) ✅
- [ ] Logs show successful login ✅
- [ ] GameTracker started ✅
- [ ] Commands work in Discord ✅
- [ ] PM2 saved (`pm2 save`) ✅
- [ ] Auto-start configured (`pm2 startup`) ✅

---

## 📝 Notes

- **Production mode** uses compiled code (`dist/`) - faster startup
- **Development mode** uses `tsx` - hot reload (requires node_modules)
- **Working directory** is `/home/afc/Desktop/LePacte/DUOQ-Tracker`
- **Logs location** is `./logs/pm2-*.log`

---

**Last Updated:** 2025-11-02
**Version:** 0.1.0
**Status:** Production-ready ✅

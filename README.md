# `wod-booker` 🏋️‍♂️

Automated class booking system for WodBoard that handles scheduling and confirmations through Discord.

## Features

- 📅 Fetches upcoming classes for the next 7 days
- 💬 Creates Discord threads for class confirmations
- ✅ Tracks confirmation status via reactions
- 🎟️ Automatically books confirmed classes when they become available
- 📱 Uses the WodBoard mobile API for reliable booking

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `classes.toml` file with your configuration:
```toml
discord_channel_id = "your_channel_id"
discord_bot_token = "your_bot_token"
[[users]]
name = "Your Name"
username = "your_email@example.com"
password = "your_password"
discord_id = "your_discord_user_id"
[[users.classes]]
name = "WOD Class"
time = "07:00"
days = ["Monday", "Friday"]
```
3. Build the project:
```bash
pnpm build
```

## Deployment

### Using Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t wod-booker .
```

2. Create your configuration:
```bash
cp classes.example.toml classes.toml
# Edit classes.toml with your settings
```

3. Run the container with required volumes:
```bash
docker run -d \
  --name wod-booker \
  -v "$(pwd)/classes.toml:/app/classes.toml:ro" \
  -v "$(pwd)/bookings.db:/app/bookings.db" \
  wod-booker
```

The container requires two volume mounts:
- `classes.toml`: Your configuration file (read-only)
- `bookings.db`: SQLite database for tracking confirmations

The container includes two cron jobs:
- Weekly confirmation requests (Sundays at 5pm)
- Booking service (5 minutes past every hour)

View logs:
```bash
docker logs wod-booker
# or
docker exec wod-booker cat /app/cron.log
```

### Manual Setup

If you prefer to run without Docker, you'll need to set up the cron jobs manually:

1. Open your crontab:
```bash
crontab -e
```

2. Add the cron jobs:
```bash
0 17 * * 0 cd /path/to/wod-booker && pnpm request-confirmations >> cron.log 2>&1
5 * * * * cd /path/to/wod-booker && pnpm start >> cron.log 2>&1
```

## Development

- `pnpm dev` - Run the booking service with hot reloading
- `pnpm dev:request-confirmations` - Run the confirmation requests with hot reloading
- `pnpm test:auth` - Test authentication
- `pnpm test:classes` - Test class fetching
- `pnpm test:confirmation-flow` - Test the confirmation system


/**
 * PM2 Ecosystem Configuration
 *
 * Deploy the DuoQ Tracker bot on Digital Ocean with PM2
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 logs duoq-tracker
 *   pm2 restart duoq-tracker
 *   pm2 stop duoq-tracker
 *   pm2 delete duoq-tracker
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'duoq-tracker',

      // Entry point (wrapper script that uses tsx from node_modules)
      script: './start-bot.sh',

      // Number of instances (1 for Discord bot - no clustering needed)
      instances: 1,

      // Auto-restart on crash
      autorestart: true,

      // Watch for file changes (disable in production)
      watch: false,

      // Max memory restart (2GB)
      max_memory_restart: '2G',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },

      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      // Error logs
      error_file: './logs/pm2-error.log',

      // Combined logs
      out_file: './logs/pm2-out.log',

      // Log date format
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs
      merge_logs: true,

      // Time in ms before sending final SIGKILL signal
      kill_timeout: 5000,

      // Time in ms before considering app as ready
      listen_timeout: 3000,

      // Restart delay in ms
      restart_delay: 4000,

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,

      // Min uptime to not be considered as crashed
      min_uptime: '10s',

      // Max number of unstable restarts
      max_restarts: 10,
    },
  ],
}

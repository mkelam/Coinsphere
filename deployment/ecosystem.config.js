// PM2 Ecosystem Configuration for Coinsphere
module.exports = {
  apps: [
    {
      name: 'coinsphere-backend',
      script: 'backend/src/server.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      cwd: '/home/coinsphere/Coinsphere',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/home/coinsphere/logs/backend-error.log',
      out_file: '/home/coinsphere/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};

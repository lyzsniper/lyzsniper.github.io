/**
 * PM2 进程管理配置
 * 用法：
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'blog-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '127.0.0.1',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: '0.0.0.0',
      },
      out_file: '../../logs/api-out.log',
      error_file: '../../logs/api-error.log',
      merge_logs: true,
      time: true,
    },
  ],
}

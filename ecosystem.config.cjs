module.exports = {
  apps: [
    {
      name: "dkraft-frontend",
      script: "serve",
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 3009,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    }
  ]
};

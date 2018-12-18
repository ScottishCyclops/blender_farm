const mix = require('laravel-mix')


mix
  .setPublicPath('public/webapp')
  .js('webapp/app.js', 'public/webapp')
  .extract([
    'mithril',
    'moment',
  ])
  .sass('webapp/app.scss', 'public/webapp')
  .copy('res/', 'public/webapp/')
  .copy('webapp/index.html', 'public/webapp/')
  .options({ processCssUrls: false })
  .disableNotifications()
  .sourceMaps(false)

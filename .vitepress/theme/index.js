// .vitepress/theme/index.js
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Documate from './documate/index'
import './documate/styles/vars.css'
import './documate/styles/markdown-body.css'
import './documate/styles/highlight-js.css'
import './custom.css'

export default {
  ...DefaultTheme,
  Layout: h(DefaultTheme.Layout, null, {
    'nav-bar-content-before': () => h(
      Documate,
      {
        endpoint: 'http://localhost:9999/ai/askStream',
      },
    )
  })
}

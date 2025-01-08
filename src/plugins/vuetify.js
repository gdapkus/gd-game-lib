/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
  display: {
    mobileBreakpoint: 'xs',
    thresholds: {
      xs: 0,
      sm: 640,
      md: 800,
      lg: 1280,
      xl: 1920,
    },
  },
})

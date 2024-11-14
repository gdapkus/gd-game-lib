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
      sm: 600,
      md: 540,
      lg: 800,
      xl: 1280,
    },
  },
})

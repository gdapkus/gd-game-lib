// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import VueCookies from 'vue-cookies';

// Composables
import { createApp } from 'vue'
const app = createApp(App)
app.use(VueCookies);
registerPlugins(app)
app.mount('#app')
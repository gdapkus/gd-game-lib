<template>
  <v-app>
    <v-container>
      <!-- Use v-if to conditionally render based on screen size -->
      <GamesCompact v-if="isMobile" />
      <Games v-else />
    </v-container>
  </v-app>
</template>

<script>
import Games from '@/components/Games.vue'; 
import GamesCompact from './components/GamesCompact.vue';
import { useDisplay } from 'vuetify'

export default {
  components: {
    Games,
    GamesCompact,
  },
	setup() {
    const { smAndDown } = useDisplay()
    const isMobile = smAndDown  // This is true on small and extra-small screens
    return { isMobile }
  }
};
</script>

<template>
  <v-container>
    <h1>Test Trello Lists</h1>
    
    <!-- Display all cookies -->
    <div>
      <h2>All Cookies:</h2>
      <ul>
        <li v-for="(value, key) in allCookies" :key="key">
          {{ key }}: {{ value }}
        </li>
      </ul>
    </div>

    <!-- Trello Lists Section -->
    <div v-if="trelloLists.length">
      <h2>Trello Lists:</h2>
      <ul>
        <li v-for="list in trelloLists" :key="list.id">
          {{ list.id }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No lists available or failed to fetch lists.</p>
    </div>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      trelloLists: [],
      trelloToken: null,
      allCookies: {},
    };
  },
  async created() {
    // Retrieve and display all cookies
    this.allCookies = this.$cookies.keys().reduce((cookies, key) => {
      cookies[key] = this.$cookies.get(key);
      return cookies;
    }, {});

    // Log the Trello token to the console
    this.trelloToken = this.$cookies.get('BGGCard');
    console.log('Retrieved Trello Token from Cookie:', this.trelloToken);

    // If Trello token exists, make an API call to fetch lists
    if (this.trelloToken) {
      try {
        const response = await fetch(`/api/getTrelloLists?token=${this.trelloToken}`);
        if (response.ok) {
          const lists = await response.json();
          this.trelloLists = lists;
        } else {
          console.error('Failed to load Trello lists:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching Trello lists:', error);
      }
    } else {
      console.error('Trello token not found');
    }
  }
};
</script>

<style scoped>
h1 {
  color: green;
}
</style>

<template>
  <v-app>
    <v-theme-provider theme="light">
      <v-application>
        <v-application__wrap>
          <v-container>
            <!-- Header -->
            <v-app-bar app flat color="green">
              <div style="width: 24px;"></div>
              <v-toolbar-item @click="reloadPage" style="cursor: pointer;">
                <v-img src="/favicon.ico" height="48" width="48" contain></v-img>
              </v-toolbar-item>
              <v-toolbar-title
                @click="reloadPage"
                class="font-weight-black cursor-pointer"
                style="font-size: 2rem;"
              >
                Game Library
              </v-toolbar-title>
              <v-btn icon>
                <v-icon>mdi-cog-outline</v-icon>
                <v-menu activator="parent">
                  <v-list>
                    <v-list-item @click="authorizeTrello">
                      <v-list-item-title>Authorize Trello</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="updateCollection">
                      <v-list-item-title>Update Collection</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-btn>
            </v-app-bar>
            <v-snackbar v-model="snackbarVisible" location="top" :timeout="5000">
              {{ snackbarMessage }}
              <v-btn color="green" text @click="snackbarVisible = false">Close</v-btn>
            </v-snackbar>
            <!-- Main content -->
            <v-main>
              <v-row class="mx-auto mt-6">
                <v-col cols="12">
                  <v-autocomplete
                    label="Search games"
                    v-model="search"
                    :items="games.map(game => game.name)"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row class="mx-auto mb-6">
                <v-col cols="12">
                  <v-data-table :headers="headers" :items="filteredGames" class="v-table--density-compact">
                    <template v-slot:item="{ item }">
                      <tr>
                        <td class="v-data-table__td" @click="showDropdown($event, item.id)">
                          <v-img :src="item.thumbnail" max-height="150px" contain class="my-3"></v-img>
                        </td>
                        <td class="v-data-table__td" @click="showDropdown($event, item.id)">
                          {{ item.name }}
                        </td>
                        <td class="v-data-table__td" style="text-align: center">
                          {{ item.minPlayers }} - {{ item.maxPlayers }}
                        </td>
                        <td class="v-data-table__td" style="text-align: center">{{ item.bestAtCount }}</td>
                      </tr>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-main>

            <!-- Dropdown Menu -->
            <v-menu
              v-model="dropdowns[selectedItemId]"
              :close-on-content-click="false"
              :activator="dropdownActivator"
              offset-y
            >
              <v-list>
                <v-list-item @click="goToGamePage(selectedItemId)">
                  <v-list-item-title>Open BGG Game Page</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="trelloToken">
                  <v-list-item-title>Add to Trello</v-list-item-title>
                  <v-list-item-icon>
                    <v-icon>mdi-menu-down</v-icon>
                  </v-list-item-icon>
                  <v-menu offset-y activator="parent">
                    <template v-slot:default>
                      <v-list>
                        <!-- Loop through fetched Trello lists -->
                        <v-list-item
                          v-for="list in trelloLists"
                          :key="list.id"
                          @click="addToTrello(selectedItemId, list.id)"
                        >
                          <v-list-item-title>{{ list.name }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </template>
                  </v-menu>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- Footer -->
            <v-footer app flat color="green" class="d-flex justify-center text-body-2">
              Original data requested from
              <a href="https://www.boardgamegeek.com/" target="bgg">BoardGameGeek.com</a>.
            </v-footer>
          </v-container>
        </v-application__wrap>
      </v-application>
    </v-theme-provider>
  </v-app>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      games: [],
      search: '',
      dropdownVisible: false,
      dropdowns: {}, // Track visibility of dropdowns by game ID
      dropdownActivator: null,
      selectedItem: null,
      selectedItemId: null, // Track ID of selected item
      trelloLists: [], // Store the fetched Trello lists
      trelloToken: null, // Trello token fetched from the cookies
      snackbarVisible: false, // Controls the visibility of the snackbar
      snackbarMessage: '', // Message to display in the snackbar
	  headers: [
          { title: 'Cover'},
		  {
			  title: 'Title',
			  key: 'name',
			  sortRaw: (a, b) => {
				  // Remove articles ("The", "A", "An") and trim for comparison
				  const titleA = a.name.replace(/^(The|A|An)\s+/i, '').trim();
				  const titleB = b.name.replace(/^(The|A|An)\s+/i, '').trim();
				  
				  return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
		  },
      },
          { title: 'Player Range', align: 'center'},
          { title: 'Best At', align: 'center'},
      ],
    };
  },

  computed: {
    filteredGames() {
      if (!this.search) {
        return this.games.filter(game => game.type === 'boardgame');
      }
      return this.games.filter(
        game => game.type === 'boardgame' && game.name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },
  async created() {
    try {
      document.title = "My Game Library";

      // Fetch game data from the server-side API
      const response = await fetch('/api/games');
      if (response.ok) {
        const { games } = await response.json();
        this.games = games;
      } else {
        console.error('Failed to load games:', response.statusText);
      }

      // Retrieve the Trello token from the cookies
      this.trelloToken = this.$cookies.get('BGGCard');

      // If Trello token exists, make an API call to fetch lists
      if (this.trelloToken) {
        const trelloResponse = await fetch(`/api/getTrelloLists?token=${this.trelloToken}`);
        if (trelloResponse.ok) {
          this.trelloLists = await trelloResponse.json();
        } else {
          console.error('Failed to load Trello lists:', trelloResponse.statusText);
        }
      } else {
        console.error('Trello token not found');
      }
    } catch (error) {
      console.error('Error fetching games or Trello lists:', error);
    }
  },
  methods: {
    reloadPage() {
      window.location.reload();
    },
    goToGamePage(gameId) {
      const game = this.games.find(g => g.id === gameId);
      window.open(game.link, '_blank');
    },
    authorizeTrello() {
      const trelloKey = import.meta.env.VITE_TRELLO_KEY;
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/trelloCallback`);
      const authWindow = window.open(
        `https://trello.com/1/authorize?expiration=never&key=${trelloKey}&scope=read,write&response_type=token&return_url=${callbackUrl}`,
        'authWindow',
        'width=600,height=800'
      );

      const pollForToken = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(pollForToken);
            this.trelloToken = this.$cookies.get('BGGCard');

            if (this.trelloToken) {
              this.snackbarMessage = 'Token set successfully!';
              this.snackbarVisible = true;

              try {
                const response = await fetch(`/api/getTrelloLists?token=${this.trelloToken}`);
                if (response.ok) {
                  this.trelloLists = await response.json();
                } else {
                  this.snackbarMessage = 'Failed to load Trello lists';
                  this.snackbarVisible = true;
                }
              } catch (error) {
                this.snackbarMessage = 'Error fetching Trello lists';
                this.snackbarVisible = true;
              }
            } else {
              this.snackbarMessage = 'Token setting failed!';
              this.snackbarVisible = true;
            }
          }
        } catch (e) {
          console.error('Error polling for token:', e);
        }
      }, 1000);
    },
    showDropdown(event, itemId) {
      this.selectedItemId = itemId;
      this.dropdownActivator = event.currentTarget;
      this.dropdowns[itemId] = true;
    },
    async updateCollection() {
      try {
        this.snackbarMessage = 'Updating collection...';
        this.snackbarVisible = true;
        const response = await axios.get('/api/loadCollection');
        if (response.status === 200) {
          this.snackbarMessage = 'Collection updated successfully!';
          try {
            this.snackbarMessage = 'Caching new games...';
            const detailsResponse = await axios.get('/api/loadDetails');
            if (detailsResponse.status === 200) {
              this.snackbarMessage = 'Games updated successfully!';
            } else {
              this.snackbarMessage = 'Failed to update games. Try again.';
            }
          } catch (error) {
            this.snackbarMessage = `Error updating games: ${error.message}`;
          } finally {
            this.snackbarVisible = true;
          }
        } else {
          this.snackbarMessage = 'Failed to update collection. Try again.';
        }
      } catch (error) {
        this.snackbarMessage = `Error updating collection: ${error.message}`;
      } finally {
        this.snackbarVisible = true;
      }
    },
    async addToTrello(gameId, listId) {
      try {
        const game = this.games.find(g => g.id === gameId);
        const list = this.trelloLists.find(l => l.id === listId);

        await axios.post('/api/createTrelloCard', {
          listId: listId,
          gameId: gameId,
          trelloToken: this.trelloToken,
        });

        this.snackbarMessage = `${game.name} added to Trello list "${list.name}"`;
        this.snackbarVisible = true;
        this.dropdownVisible = false;
      } catch (error) {
        console.error('Error adding game to Trello:', error.response || error);
      }
    },
  },
};
</script>

<style>
img {
  object-fit: cover;
}
</style>

<template>
  <v-app>
    <v-theme-provider theme="light">
          <v-container>
            <!-- Header -->
            <v-app-bar app flat color="green">
              <div style="width: 24px;"></div>
              <v-avatar @click="reloadPage" style="cursor: pointer;" size="48" image="/favicon.ico" rounded="0">
              </v-avatar>
              <v-toolbar-title
                @click="reloadPage"
                class="font-weight-black cursor-pointer"
                style="font-size: 2rem;"
              >
                {{ activeUser ? `${activeUser.name}'s Game Library` : 'Game Library' }}
              </v-toolbar-title>
              <v-btn icon>
                <v-icon>mdi-cog-outline</v-icon>
                <v-menu activator="parent">
                  <v-list>
                    <v-list-item @click="authorizeTrello">
                      <v-list-item-title>Authorize Trello</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="switchCollection">
                      <v-list-item-title>Switch Collection</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="updateCollection">
                      <v-list-item-title>Update Collection</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-btn>
            </v-app-bar>

            <!-- Switch Collection Dialog -->
            <v-dialog v-model="CollectionDialog" width="400" persistent>
              <v-card>
                <v-card-title class="headline">Select User</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="user in bggUsers" :key="user.username" @click="selectUser(user)">
                      <template v-slot:prepend>
                        <v-avatar size="64" rounded="0">
                          <img :src="user.avatarUrl" alt="User Avatar" />
                        </v-avatar>
                      </template>
                        <v-list-item-title>{{ user.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ user.username }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <v-checkbox
                    v-model="setAsDefault"
                    label="Set as default"
                    class="mt-4"
                    @change="toggleDefaultUser"
                  ></v-checkbox>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="CollectionDialog = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Snackbar for notifications -->
            <v-snackbar v-model="snackbarVisible" location="top" :timeout="5000">
              {{ snackbarMessage }}
              <v-btn color="green" text @click="snackbarVisible = false">Close</v-btn>
            </v-snackbar>

            <!-- Main content -->
         
            <v-main>   
				<!-- Search Bar -->
              <v-row class="mx-auto mt-6">
                <v-col cols="12">
                  <v-autocomplete
                    label="Search games"
                    v-model="search"
                    :items="filteredGames.map(game => game.name)"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row class="mx-auto mb-6">
                <v-col cols="12">
                  <v-data-table :headers="headers" :items="filteredGames" class="v-table--density-compact">
                    <template v-slot:item="{ item }">
                      <tr>
                        <td class="v-data-table__td" @click="showDropdown($event, item.id)">
                          <v-img :src="item.thumbnail" max-height="120px" contain class="my-3"></v-img>
                        </td>
                        <td class="v-data-table__td" @click="showDropdown($event, item.id)">
                          <span class="title-text">{{ item.name }}</span>
						  <span class="year-text"> ({{ item.yearPublished }})</span><br>
						  <span class="designer-text">{{ item.designers.join(', ') }}</span>
                        </td>
						<td class="v-data-table__td" style="text-align: center;">
							<div class="hexagon" :style="getHexagonStyle(item.averageRating)">
								<span class="hex-text">{{ formatRating(item.averageRating) }}</span>
							</div>
						</td>
                        <td class="v-data-table__td" style="text-align: center">
                          <div class="players-icon">{{ item.minPlayers }} - {{ item.maxPlayers }}</div>
                        </td>
                        <td class="v-data-table__td" style="text-align: center">
                          <div class="meeple-icon">{{ item.bestAtCount }}</div>
                        </td>
                        <td class="v-data-table__td" style="text-align: center">
                          <div class="time-icon">{{ item.playingTime }}</div>
                        </td>
                        <td class="v-data-table__td" style="text-align: center">
                          <div class="weight-icon">{{ formatWeight(item.averageWeight) }}</div>
						</td>
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
                    <v-icon>mdi-menu-down</v-icon>
                  <v-menu offset-y activator="parent">
                    <template v-slot:default>
                      <v-list>
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
    </v-theme-provider>
  </v-app>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      games: [],
      bggUsers: [],
      activeUser: [],
      search: '',
      dropdownVisible: false,
      dropdowns: {},
      dropdownActivator: null,
      selectedItem: null,
      selectedItemId: null,
      trelloLists: [],
      trelloToken: null,
      snackbarVisible: false,
      snackbarMessage: '',
      CollectionDialog: false,
      setAsDefault: false,
      headers: [
        { title: 'Cover' },
        {
          title: 'Title',
          key: 'name',
          sortRaw: (a, b) => {
            const titleA = a.name.replace(/^(The|A|An)\\s+/i, '').trim();
            const titleB = b.name.replace(/^(The|A|An)\\s+/i, '').trim();
            return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
          },
        },
        { title: 'Rating', width: '48px', align: 'center' },
        { title: 'Player Range', width: '48px', align: 'center' },
        { title: 'Best At', width: '48px', align: 'center' },
        { title: 'Play Time', width: '48px', align: 'center' },
        { title: 'Weight', width: '48px', align: 'center' },
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
      const bggUsersResponse = await fetch(`/api/bgg-users`);
      this.bggUsers = await bggUsersResponse.json();

      const activeUsername = this.$cookies.get('activeUser');
      const defaultUsername = this.$cookies.get('defaultUser');
      const userToLoad = activeUsername || defaultUsername;
      const savedUser = this.bggUsers.find(user => user.username === userToLoad);

      if (savedUser) {
        this.setUser(savedUser);
      } else {
        this.setUser(this.bggUsers[0]);
      }

      await this.loadGames();
      this.trelloToken = this.$cookies.get('BGGCard');

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
    getHexagonStyle(rating) {
      if (rating <= 5) return { backgroundColor: 'rgb(255, 0, 0)' }; // Red for ≤ 5
      if (rating >= 10) return { backgroundColor: 'rgb(0, 255, 0)' }; // Green for 10+
      let color;
      if (rating > 5 && rating <= 7.5) {
        const t = (rating - 5) / 2.5;
        const r = Math.round(255 * (1 - t));
        const b = Math.round(255 * t);
        color = `rgb(${r}, 0, ${b})`;
      } else {
        const t = (rating - 7.5) / 2.5;
        const g = Math.round(255 * t);
        const b = Math.round(255 * (1 - t));
        color = `rgb(0, ${g}, ${b})`;
      }
      return { backgroundColor: color };
    },
    formatRating(rating) {
      return rating ? parseFloat(rating).toFixed(1) : 'N/A';
    },
    formatWeight(weight) {
      return weight ? parseFloat(weight).toFixed(1) : 'N/A';
    },
    switchCollection() {
      this.CollectionDialog = true;
    },
    async selectUser(user) {
      this.setUser(user);
      this.CollectionDialog = false;

      await this.loadGames();

      if (this.setAsDefault) {
        this.$cookies.set('defaultUser', user.username, '730d');
        this.$cookies.set('activeUser', user.username, 'session');
        this.setAsDefault = false;
        this.snackbarMessage = `${user.name}'s collection is now the default collection.`;
        this.snackbarVisible = true;
      } else {
        this.$cookies.set('activeUser', user.username, 'session');
        this.snackbarMessage = `Now viewing ${user.name}'s collection.`;
        this.snackbarVisible = true;
      }
    },
    toggleDefaultUser() {
      console.log("Checkbox checked:", this.setAsDefault);
    },
    setUser(user) {
      this.activeUser = user;
      document.title = `${user.name}'s Game Library`;
    },
    async loadGames() {
      try {
        const response = await fetch(`/api/games/${this.activeUser.username}`);
        if (response.ok) {
          const { games } = await response.json();
          this.games = games;
        } else {
          console.error('Failed to load games:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading games:', error);
      }
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
        const response = await axios.get(`/api/loadCollection/${this.activeUser.username}`);
        if (response.status === 200) {
          this.snackbarMessage = 'Collection updated successfully!';
          try {
            this.snackbarMessage = 'Caching new games...';
            const detailsResponse = await axios.get(`/api/loadDetails/${this.activeUser.username}`);
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

<style scoped>
img {
  object-fit: cover;
}
.title-text {
  font-size: 1.25rem; 
  line-height: 1;
}
.designer-text {
  font-size: .8rem; 
  line-height: 0.8;
  color: green;
}
.year-text {
  font-size: .7rem; 
  color: grey;
}
.hexagon {
  position: relative;
  width: 48px; /* Size of the hexagon */
  height: 48px;
  background-color: #ccc; /* Default background color */
  clip-path: polygon(
    50% 0%, 
    100% 25%, 
    100% 75%, 
    50% 100%, 
    0% 75%, 
    0% 25%
  ); /* Create a hexagon */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* Text color */
  font-weight: bold;
  text-align: center;
}

.hex-text {
  position: relative;
  z-index: 2;
  font-size: 0.9rem; /* Adjust font size */
}
.players-icon {
  position: relative;
  display: inline-block; 
  width: 48px;
  height: 48px;
  margin: 0 auto;
  background-image: url('@/assets/players.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  line-height: 48px;
  text-align: center;
  font-weight: bold;
  color: #333;
}
.meeple-icon {
  position: relative;
  display: inline-block; 
  width: 48px;
  height: 48px;
  margin: 0 auto;
  background-image: url('@/assets/meeple.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  line-height: 48px;
  text-align: center;
  font-weight: bold;
  color: #333;
}
.time-icon {
  position: relative;
  display: inline-block; 
  width: 48px;
  height: 48px;
  margin: 0 auto;
  background-image: url('@/assets/time.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  line-height: 48px;
  text-align: center;
  font-weight: bold;
  color: #333;
}
.weight-icon {
  position: relative;
  display: inline-block; 
  width: 48px;
  height: 48px;
  margin: 0 auto;
  background-image: url('@/assets/weight.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  line-height: 32px;
  text-align: center;
  font-weight: bold;
  color: #333;
}
</style>

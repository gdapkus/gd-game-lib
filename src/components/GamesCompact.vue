<template>
  <v-app>
    <v-theme-provider theme="dark">
          <v-container>
            <!-- Header -->
            <v-app-bar app flat color="green">
              <div style="width: 24px;"></div>
              <v-avatar @click="reloadPage" style="cursor: pointer;" size="48" image="/favicon.ico" rounded="0">
              </v-avatar>
              <v-toolbar-title
                @click="reloadPage"
                class="font-weight-black cursor-pointer"
                style="font-size: 1.1rem;"
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
                    <v-list-item @click="filtersDialog = true">
                      <v-list-item-title>Filter Games</v-list-item-title>
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

            <v-dialog v-model="filtersDialog" width="320">
              <v-card class="filters-card">
                <v-card-title class="headline filter-header">Filters</v-card-title>
                <v-card-text>
                  <v-radio-group
                    v-model="selectedPlayerCount"
                    inline
                    hide-details
                    class="player-count-group"
                    @update:model-value="handlePlayerCountChange"
                  >
                    <template #label>
                      <span class="text-subtitle-1 font-weight-bold mb-2">Player Count</span>
                    </template>
                    <v-radio
                      v-for="option in playerCountOptions"
                      :key="option.label"
                      :label="option.label"
                      :value="option.value"
                      density="comfortable"
                      class="player-count-radio"
                    ></v-radio>
                  </v-radio-group>
                  <v-switch
                    v-model="bestAtOnly"
                    label="Best At only"
                    :disabled="selectedPlayerCount === null"
                    color="success"
                  ></v-switch>
                  <v-divider class="my-4"></v-divider>
                  <div class="text-subtitle-1 font-weight-bold mb-2">
                    Weight Range
                  </div>
                  <v-range-slider
                    v-model="weightRange"
                    :min="1"
                    :max="5"
                    :step="0.1"
                    thumb-label="always"
                    color="success"
                    class="weight-slider"
                  ></v-range-slider>
                  <v-divider class="my-4"></v-divider>
                  <v-switch
                    v-model="includeExpansions"
                    label="Include Expansions"
                    color="success"
                  >
                    <template #label>
                      <span class="text-subtitle-2">Include Expansions</span>
                    </template>
                  </v-switch>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="text" @click="resetFilters">Reset Filters</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="filtersDialog = false">Close</v-btn>
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
                          <v-img :src="item.thumbnail" max-height="150px" contain class="my-3"></v-img>
                        </td>
                        <td class="v-data-table__td" @click="showDropdown($event, item.id)">
                          {{ item.name }}
                        </td>
                        <td class="v-data-table__td rating-cell">
                          <div class="hexagon" :style="getHexagonStyle(item.averageRating)">
                            <span class="hex-text">{{ formatRating(item.averageRating) }}</span>
                          </div>
                        </td>
                        <td class="v-data-table__td time-cell">
                          <div class="time-icon">{{ item.playingTime }}</div>
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
      includeExpansions: false,
      selectedPlayerCount: null,
      bestAtOnly: false,
      weightRange: [1, 5],
      playerCountOptions: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 },
        { label: '6+', value: '6+' },
        { label: 'All', value: null },
      ],
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
      filtersDialog: false,
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
        { title: 'Rating', key: 'averageRating', align: 'center' },
        { title: 'Play Time', key: 'playingTime', align: 'center' },
      ],
    };
  },

  computed: {
    filteredGames() {
      const allowedTypes = this.includeExpansions
        ? ['boardgame', 'boardgameexpansion']
        : ['boardgame'];
      const searchTerm = this.search ? this.search.toLowerCase() : '';
      const selectedCount = this.selectedPlayerCount;
      const enforceBestAt = this.bestAtOnly && selectedCount !== null;
      const [minWeight, maxWeight] = Array.isArray(this.weightRange)
        ? this.weightRange
        : [1, 5];

      const parseBestAtCounts = value => {
        if (!value) {
          return [];
        }
        return value
          .toString()
          .split(/[,/]/)
          .map(part => part.trim())
          .filter(Boolean)
          .map(part => {
            if (/^\d+\+$/.test(part)) {
              return { value: Number(part.replace('+', '')), plus: true };
            }
            const numeric = Number(part);
            return Number.isNaN(numeric) ? null : { value: numeric, plus: false };
          })
          .filter(Boolean);
      };

      const matchesPlayerSelection = game => {
        if (selectedCount === null) {
          return true;
        }

        const minPlayers = Number(game.minPlayers);
        const maxPlayers = Number(game.maxPlayers);

        if (Number.isNaN(minPlayers) || Number.isNaN(maxPlayers)) {
          return false;
        }

        if (selectedCount === '6+') {
          if (maxPlayers < 6) {
            return false;
          }
          if (enforceBestAt) {
            const bestAtValues = parseBestAtCounts(game.bestAtCount);
            return bestAtValues.some(entry =>
              entry.plus ? entry.value >= 6 : entry.value >= 6
            );
          }
          return true;
        }

        const target = Number(selectedCount);
        if (target < minPlayers || target > maxPlayers) {
          return false;
        }

        if (!enforceBestAt) {
          return true;
        }

        const bestAtValues = parseBestAtCounts(game.bestAtCount);
        return bestAtValues.some(entry => {
          if (entry.plus) {
            return target >= entry.value;
          }
          return entry.value === target;
        });
      };

      return this.games.filter(game => {
        // Add this line to filter by owned status
        if (!game.status || !game.status.own) {
          return false;
        }

        if (!allowedTypes.includes(game.type)) {
          return false;
        }

        if (!matchesPlayerSelection(game)) {
          return false;
        }

        if (searchTerm && !game.name.toLowerCase().includes(searchTerm)) {
          return false;
        }

        const weight = Number(game.averageWeight);
        if (!Number.isNaN(weight)) {
          if (weight < minWeight || weight > maxWeight) {
            return false;
          }
        }

        return true;
      });
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
    handlePlayerCountChange(value) {
      if (value === null) {
        this.bestAtOnly = false;
      }
    },
    getHexagonStyle(rating) {
      if (rating <= 5) return { backgroundColor: 'rgb(255, 0, 0)' };
      if (rating >= 10) return { backgroundColor: 'rgb(0, 255, 0)' };
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
    reloadPage() {
      window.location.reload();
    },
    resetFilters() {
      this.includeExpansions = false;
      this.selectedPlayerCount = null;
      this.bestAtOnly = false;
      this.weightRange = [1, 5];
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
.hexagon {
  position: relative;
  width: 38px;
  height: 38px;
  background-color: #ccc;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  text-align: center;
}
.hex-text {
  position: relative;
  z-index: 2;
  font-size: 0.80rem;
}
.time-icon {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 38px;
  margin: 0 auto;
  background-image: url('@/assets/time.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  line-height: 38px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: bold;
  color: #333;
  filter: invert(1);
}
.rating-cell,
.time-cell {
  text-align: center;
  padding: 0px 0px;
  width: 20px;
}
.filters-card {
  background-color: #f5faf5;
}
</style>

<style scoped>
.player-count-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.player-count-radio {
  margin: 0;
}
.weight-slider {
  margin: 0 8px;
    transform: translateY(+50%);
}
.filter-header {
  background-color: #e8f5e9;
  color: #1b5e20;
}
</style>

<template>
  <v-data-table :headers="headers" :items="games" class="v-table--density-compact">
    <template v-slot:item="{ item }">
      <tr>
        <td class="v-data-table__td" @click="$emit('show-dropdown', item.id)">
          <v-img :src="item.thumbnail" max-height="150px" contain class="my-3"></v-img>
        </td>
        <td class="v-data-table__td">{{ item.name }}</td>
        <td class="v-data-table__td" style="text-align: center">
          {{ item.minPlayers }} - {{ item.maxPlayers }}
        </td>
        <td class="v-data-table__td" style="text-align: center">{{ item.bestAtCount }}</td>
      </tr>
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    games: Array,
    compact: Boolean,
  },
  data() {
    return {
      headers: [
        { text: 'Cover', value: 'cover' },
        { text: 'Title', value: 'name' },
        { text: 'Player Range', align: 'center' },
        { text: 'Best At', align: 'center' },
      ],
    };
  },
};
</script>

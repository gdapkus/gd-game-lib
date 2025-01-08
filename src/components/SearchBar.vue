<template>
  <v-autocomplete
    label="Search games"
    v-model="query"
    :items="items"
    @input="updateSearch"
  ></v-autocomplete>
</template>

<script>
export default {
  props: {
    items: Array,
  },
  data() {
    return {
      query: '',
    };
  },
  methods: {
    updateSearch() {
      this.$emit('search', this.query);
    },
  },
};
</script>

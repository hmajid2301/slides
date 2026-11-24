<script setup lang="ts">
// "Stonks" meme cameo for the ~10× result. Image: the Stonks template (imgflip.com/memetemplate/186821996).
import img from '../images/stonks.jpg'
</script>

<template>
  <img class="stonks" :src="img" alt="" width="220" height="165">
</template>

<style scoped>
.stonks { display: block; outline: 4px solid #04121c; box-shadow: 6px 6px 0 #04121c; }
</style>

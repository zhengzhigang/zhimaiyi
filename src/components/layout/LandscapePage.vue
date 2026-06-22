<template>
  <view class="landscape-wrapper">
    <view class="landscape-container">
      <slot></slot>
    </view>
  </view>
</template>

<script lang="ts" setup name="LandscapePage">
</script>

<style>
.landscape-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 9999;
  background-color: #148a86;
}

.landscape-container {
  position: absolute;
  width: 100vh;
  height: 100vw;
  top: 0;
  left: 0;
  transform-origin: top left;
  transform: rotate(90deg) translateY(-100%);
  background-color: #148a86;
  overflow: hidden;
}
</style>

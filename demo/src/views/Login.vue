<script>
export default {
  name: "login",
  $$route: {
    lazy: "login",
    a:{
      i:'asd1',
    }
  }
};
</script>
<template>
  <div class="page login-page">

    <h1>登录页面</h1>
    <button @click="$router.push({name:'listPage'})">进入</button>
  </div>
</template>
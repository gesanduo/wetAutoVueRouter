<template>
<div>
  <div>Hello world!</div>
  <div>欢迎来到_id {{id}}页面</div>
  </div>
</template>
<script>
export default {
  $$route: {
    name:'ID',
  },
  data(){
    return {
      id:this.$route.params.id
    }
  }
}
</script>
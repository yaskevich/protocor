module.exports = {
  apps : [
      {
        name: "protocor",
        script: "./index.js",
        watch: false,
        instance_var: 'INSTANCE_ID',
        env: {
            "PORT": 3061,
            "NODE_ENV": "production"
        }
      }
  ]
}
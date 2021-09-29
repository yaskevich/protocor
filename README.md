<div align="center">
	<img src="runa.svg" width="800" height="400">
</div>

# Next generation UI for the National Corpus of Russian Language

Projects consists of two parts: server (backend) and client (frontend). Both are written in modern JavaScript.

### Server requirements:

- NodeJS v.14+
- PostgreSQL v.9.6+

Client application is built with *Vue 3* reactive framework, and it needs NodeJS to build the bundle.

### Deployment
To run the platform one has to build the client application and start the server application.
Example of deploying is in `deploy-runa.sh` file: it gets the codebase from the Github and runs it under PM2 process mananger.
Download the script and put along with it `runa.env` file that contains environment variables like this:

```
PGUSER=username
PGHOST=127.0.0.1
PGPASSWORD=databasepassword
PGDATABASE=databasename
PGPORT=5432
PORT=8080
JWT_SECRET=anythingyoulike
```
Afterwards, execute `sh deploy-runa.sh`
#### Note

As for the middle of 2021, backend relies on existing API presented by monolith architecture of [Ruscorpora.ru](https://ruscorpora.ru/) and does not make queries directly to Ruscorpora search engine.

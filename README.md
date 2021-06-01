<div align="center">
	<img src="runa.svg" width="800" height="400">
</div>

# Next generation UI for the National Corpus of Russian Language

Projects consists of two parts: server (backend) and client (frontend). Both are written in modern JavaScript.

### Server requirements:

- NodeJS v.14+
- PostgreSQL v.9.6+

Client application is built with *Vue 3* reactive framework, and it needs NodeJS to build the bundle.

#### Note

As for the middle of 2021, backend relies on existing API presented by monolith architecture of [Ruscorpora.ru](https://ruscorpora.ru/) and does not make queries directly to Ruscorpora search engine.

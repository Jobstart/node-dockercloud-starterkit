# ---WORK IN PROGRESS---


# NodeJS Docker Cloud Starter Kit

A comprehensive scaffold for building, testing, and deploying NodeJS micro-services using Docker Cloud and blue/green deployments.


# Why?
There aren't many quality tutorials covering how to implement simple micro-services end-to-end.  Our aim with this project is to democratize micro-services architecture using [NodeJS](https://nodejs.org) as a technology so that such a pattern can be more approachable to developers who won't have time to research an approach themselves.  [Docker Cloud](https://cloud.docker.com) has significantly lowered the burden to entry with service oriented architecture, allowing developers to better focus on delivering clean units of business value rather than worrying about ops around deployment, discovery, or load-balancing.  That being said, Docker Cloud isn't yet perfect.  Deployment strategies, continuous integration/deployment, and how everything "fits together" are still left up to the developer in many cases.  Several incredibly simple patterns are already widely available but are not well documented outside of the DevOps community.  We hope that this scaffold allows you, the developer, to avoid some of the complexities that we have discovered while building micro-services on top of Docker Cloud.


# Pattern
At Jobstart, we decided to take a dead simple approach to micro-services.  This approach will be very familiar to those who have used frameworks like [Kubernetes](http://kubernetes.io/), but lacks the overhead of learning such a framework (thanks, in a large part, to Docker Cloud's DNS discovery and automatic load-balancing functionality).  

Simply put, a "service" is a combination of a front-facing [Docker Cloud HAProxy](https://github.com/docker/dockercloud-haproxy) instance and a horizontally scaled worker (this repo).  Requests come in to the service against the load-balancer and are passed round-robin down to worker instances.  Workers can be scaled up and down and, thanks to Docker Cloud, the load-balancer instance adapts to the change at runtime.

Integration and deployment also aims to be dead simple and avoid any form of downtime.  Using [CircleCI](https://circleci.com/), we automatically trigger a build any time source code is changed.  A build on either `dev` or `master` branches triggers a deployment to staging or production, respectively.  During the actual deployment, we follow the [blue/green deployment strategy](https://blog.tutum.co/2015/06/08/blue-green-deployment-using-containers/).  With this strategy, we scale up a second horizontally scaled cluster of workers with the latest source code, health check the second cluster, switch the load-balancer to the latest cluster, and scale down the old cluster.  The *active* worker cluster rotates from "blue" to "green", back and forth, with each deploy.  Included in this scaffold are a few simple automation scripts to handle the active cluster rotation along with the health-checks.

Automated database migrations are executed with every deployment.  Migration scripts combine a predicate (selecting what should be migrated) and a mutator (making the migration for each record) to achieve idempotent database migrations that are safe to run on every deployment (as the predicate should return 0 records on subsequent deployments).  Keeping these scripts for at least a month after creation is recommended to ensure that developers on your team have received the same benefits from the migration scripts on their local environments.


# The stack
The demo project included in this stack runs on [ExpressJS](http://expressjs.com/) for HTTP requests, [Mongoose](http://mongoosejs.com/) for data, [StatsD via DatadogHQ](https://www.datadoghq.com/) for system metrics and tuning, and [Sentry](https://getsentry.com) for exception tracking.  It is tested using [Mocha](https://mochajs.org/), [Chai](http://chaijs.com/), [Sinon](http://sinonjs.org/), and [Supertest](https://github.com/visionmedia/supertest).  The tooling runs on [BabelJS](http://babeljs.io/) and supports ES2015 plus Stage 1 language features (async/await, among others).  Service-level dependencies during development and continuous integration are managed by (Docker Compose)[https://docs.docker.com/compose/].


# Setting up CI/CD & hosting
First, make sure you have copied this scaffold to your own public repo.


##### Source-Code and Images repos

For your docker image repositories, create an account at [Docker Hub](https://hub.docker.com).  After signing up (or logging in), create a repo called `demo` on docker hub.

For source code, copy this repo over to your own public repo on Github.


##### Hosting

To setup hosting, simply login to [Docker Cloud](https://cloud.docker.com) using your Dockerhub  account information.  Step through the getting started tutorial and create one or more nodes [Digital Ocean](https://www.digitalocean.com/) is a great node provider for experiments.  Then, using the GUI, create a stack using the included [Stackfile](https://github.com/Jobstart/node-dockercloud-starterkit/blob/master/Stackfile).  Be sure to replace, in the Stackfile, the image names with references to your Dockerhub account. Goto the stack and copy the domain name of `lb`.  We will be using this in a later step.


##### CI/CD

To setup CI/CD, login with Github credentials to CircleCI.  Trigger a build on the public repo you created above and then immediately cancel it.  

Next, head back to docker cloud, goto your account settings, and create an API key.  Copy this key as we will be using it in a moment.

Head back to CircleCI, goto the project settings page, and create the following environment variables:

```
ENV=test
MONGO_PORT=27504
MONGO_HOST=localhost
MONGO_DB=test
DOCKERCLOUD_LOADBALANCER=lb
DOCKERCLOUD_LOADBALANCER_URL=<DOMAIN NAME OF lb FROM ABOVE>
DOCKERCLOUD_NUM_CONTAINERS=3
DOCKERCLOUD_SERVICE=demo-worker
DOCKERCLOUD_STACK=demo
DOCKERCLOUD_TOKEN=<API KEY FROM ABOVE>
DOCKER_EMAIL=<YOUR DOCKER ACCOUNT EMAIL>
DOCKER_PASS=<YOUR DOCKER ACCOUNT PASS>
DOCKER_USER=<YOUR DOCKER ACCOUNT USER>
```

Finally, trigger the build and the deployment should commence.


##### Notes

If you'd like to host your data the "right way", we recommend using [Compose](https://compose.io/) and keeping your infrastructure on Docker Cloud as stateless as possible.

Although we are using MongoDB as a database backend, you can very easily swap in a varient of SQL using [SequelizeJS](http://docs.sequelizejs.com/) as an ORM.

By default, DataDog and Sentry are disabled.  To enable them, populate the environment variables `SENTRY_DSN`, `DATADOG_APP_KEY`, and `DATADOG_API_KEY`.


# Development

##### System Dependencies
- [Direnv](https://github.com/direnv/direnv)
- [Docker](https://docker.com)
- [NodeJS 4.4.3](https://nodejs.org/en/)
- [NVM](https://github.com/creationix/nvm)


##### Installation

```bash
$ direnv allow # allow direnv to inject environment variables from .envrc moving forward
$ nvm install # install nodejs 4.4.3
$ nvm use # use nodejs 4.4.3
$ npm install # install dependencies
```


##### Running

```bash
$ docker-compose up -d # run service dependencies in daemon mode (non-blocking)
$ npm run development # start stream in development mode (reload on save)
```


##### Building locally

```bash
$ npm run test-local # unit, integration, build container, e2e against container
```

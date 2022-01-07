# 4. Docker Compose
여러 개의 container로 이루어진 애플리케이션을 쉽게 실행시킬 수 있는 도구입니다.

## Install Docker Compose
https://docs.docker.com/compose/install/ 를 참고하여 docker compose를 설치합니다.

## Why Docker Compose?
frontend, backend, mongodb로 이루어진 애플리케이션을 각각 container화한다면 다음과 같이 실행시킬 수 있을 겁니다.
```sh
$ docker run --name mongodb -v data:/data/db --rm -d -p 27017:27017 -e MONGO_USERNAME=admin -e MONGO_PASSWORD=secret mongo
$ docker run --name backend -v /home/yeonns/myapp/backend:/app -v /app/node_modules -v logs:/app/logs -d --rm -p 80:80 --network myapp myapp-node
$ docker run --name frontend -v /home/yeonns/myapp/frontend/src:/app/src --rm -p 3000:3000 -it myapp-react
```
각각에 대해 image를 만들고 container를 실행시키는데는 많은 docker 명령어들을 수행해야합니다. 그리고 명령어는 detach mode, network, tagging 등을 포함하다보니 너무 길어집니다!  
이처럼 여러개의 container로 이루어진 애플리케이션은 docker compose를 이용하면 쉽게 실행시킬 수 있습니다.

## Define Docker Compose
애플리케이션의 루트 디렉토리에 ```docker-compose.yaml```을 정의합니다.
```sh
$ ls myapp/
frontend
backend
docker-compose.yaml
```
최상단에는 version을 명시하고, services밑에 각 container에 대한 configuration을 정의합니다.
```yaml
version: "3.8"
services:
  mongodb:
    image: 'mongo'        # image 이름입니다 (local 및 docker hub에서 검색합니다)
    volumes:
      - data: /data/db    # anonymous volume 및 bind mount를 정의할 수 있습니다
    environment:
      MONGODB_USERNAME: admin
      MONGODB_PASSWORD: secret
    env_file:
      - ./env/mongo.env
  backend:
    build: ./backend      # Dockerfile 위치를 지정하여 image를 빌드할 수 있습니다
    #build:               # Dockerfile이 여러개 있을 경우, 이름을 지정하여 빌드할 수 있습니다
      #context: ./backend
      #dockerfile: Dockerfile-dev
      #args:
      #  some-args: 1
    ports:
    - '80:80'
    volumes:
    - logs:/app/logs
    - ./backend:/app
    - /app/node_modules
    env_file:
    - ./env/backend.env
    depends_on:
    - mongodb
    image: 'myapp-node'
  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    volumes:
      - ./frontend/src:/app/src
    stdin_open: true
    tty: true
    depends_on:
      - backend
```

docker compose를 실행/중지시키는 방법은 다음과 같습니다.
```sh
$ docker-compose up -d      # detach mode로 실행합니다
$ docker-compose down       # volume을 제외하고 container 등을 모두 shutdown 및 삭제합니다
$ docker-compose down -v    # volume을 포함해서 전부 삭제합니다
```

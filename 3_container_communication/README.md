# 3. Container Communication
container가 host machine, host machine내의 다른 container 또는 외부(HTTP)와 어떻게 communication을 할 수 있는지 알아봅니다.

## About Example
movie와 people을 조회할 수 있고, local의 mongodb에 favorite movie 및 character를 저장할 수 있는 NodeJS application 예제입니다.  
POST /favorites를 전송하면, GET /favorites로 결과를 확인할 수 있습니다.  
![create](./public/create-favorites.png)

## Run Example with Docker
현재 directory 내의 Dockerfile을 기반으로 image를 생성하고 실행시킵니다.
```sh
$ docker build -t favorites .
$ docker run --name node-app -d --rm -p 3000:3000 favorites
```

이 경우, container는 제대로 동작하지 않고, 죽어버립니다. container내에서 외부(HTTP)통신을 하는 것은 문제없지만, container내에서 host machine에서 실행되는 mongo db에 접근할 때 문제가 발생해서입니다.  
container내에서 host machine에 접근할 때는 ```localhost``` 도메인 대신 ```host.docker.internal```이라는 special 도메인을 사용해야 동작합니다. ```server.js```에서 mongo db url을 수정한 다음, image를 생성하고 다시 실행시키면 정상동작하는 것을 확인할 수 있습니다.
```js
// server.js
mongoose.connect('mongodb://host.docker.internal:27017/swfavorites', { useNewUrlParser: true }, ...
```

## Container to Container Communication
mongodb를 host machine에서 container화 한 후, favorites 애플리케이션과 통신시켜보겠습니다. 먼저 mongodb image를 실행시킨 후, inspect를 통해 ip address를 확인해야 합니다.
```sh
$ docker run -d --rm --name mongodb mongo
$ docker container inspect mongodb
...
  "GlobalIPv6PrefixLen": 0,
  "IPAddress": "172.17.0.2",    
...
```
이제 ```server.js```에서 url을 수정한 후, 실행시키면 정상동작 합니다.
```js
// server.js
mongoose.connect('mongodb://172.17.0.2:27017/swfavorites', { useNewUrlParser: true }, ...
```
이 방식은 모든 애플리케이션을 container화하였으므로, separation 및 isolation을 만족하지만 ip address를 확인해야 한다는 점, 그리고 해당 ip가 변경되면 다시 build가 필요하다는 점에서 불편합니다.

## Container to Container Communication (Enhanced Version)
ip address 대신 ```--network```옵션을 활용하면 container간 통신이 더 간편해집니다. 같은 network안에 container를 묶어두면 container 이름을 기반으로 서로 접근할 수 있게 됩니다.
```sh
# favorites-net이라는 network를 생성합니다
$ docker network create favorites-net 
$ docker network ls
# mongodb를 실행시킬 때, 생성한 network를 지정해줍니다
$ docker run -d --rm --name mongodb --network favorites-net mongo
```
```server.js```에서 mongodb url을 container의 이름인 ```mongodb```로 수정합니다.
```js
// server.js
mongoose.connect('mongodb://mongodb:27017/swfavorites', { useNewUrlParser: true }, ...
```
이제 image를 빌드하고, network를 지정하여 애플리케이션을 실행하면 정상동작합니다.
```sh
$ docker run --name node-app --network favorites-net -d --rm -p 3000:3000 favorites
```

## Container Communication Summary
||container-to-web|container-to-host|container-to-container|
|:-:|:-:|:-:|:-:|
||별도설정필요X|ip address 혹은 ```host.docker.internal```로 접근가능|ip address 혹은 network를 만들어 container name으로 접근가능|
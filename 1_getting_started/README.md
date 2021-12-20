# 1. Getting Started
node.js 서버를 docker로 실행시켜보는 예제입니다.

## Create Docker image
Dockerfile을 작성합니다.
```sh
FROM node               # docker hub에서 node 기반 이미지를 사용합니다
WORKDIR /app            # 기본적으로 container 내의 / 디렉토리를 사용하지만, 워킹 디렉토리를 /app 으로 변경합니다
COPY . ./               # local file들을 container내의 /app내로 복사합니다 (COPY . /app 로 작성해도 됩니다)
RUN npm install         # package.json에 명시된 dependency들을 설치합니다
EXPOSE 80               # container내에서 80번 포트를 expose시킵니다. documentation용도로 작성해주는 것이 좋습니다.
CMD ["node", "app.js"]  # container내에서 node app.js를 실행시킵니다
```

현재 directory 내의 Dockerfile을 기반으로 image를 생성합니다. 마지막 줄에 빌드된 이미지 id를 확인할 수 있습니다 (6580aeabccfe)
```sh
$ docker build .
...
npm notice 
Removing intermediate container 3891168d2052
 ---> 068edaf67a0a
Step 6/7 : EXPOSE 80
 ---> Running in b3c38fa08c72
Removing intermediate container b3c38fa08c72
 ---> c72857e6f873
Step 7/7 : CMD ["node", "app.js"]
 ---> Running in b77ab59678e1
Removing intermediate container b77ab59678e1
 ---> 6580aeabccfe
Successfully built 6580aeabccfe
```

## Run/Stop container 
container를 실행시킵니다. (container내의 80번 port를 local의 3000번 port로 expose시킵니다)  
localhost:3000에서 결과물을 확인할 수 있습니다.
```sh
# container 실행
$ docker run -p 3000:80 6580aeabccfe
# 현재 실행중인 container를 확인할 수 있습니다
$ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS              PORTS                                   NAMES
d765d68373bc   6580aeabccfe   "docker-entrypoint.s…"   2 minutes ago   Up About a minute   0.0.0.0:3000->80/tcp, :::3000->80/tcp   gifted_rhodes
# 실행중인 container를 중지시킵니다 (CONTAINER ID값을 활용)
$ docker stop d765d68373bc
```

## Rebuild Image
image는 기본적으로 read-only이기 때문에, image 생성 후 ```app.js```내의 코드를 수정한 후 실행시켜도 수정사항이 반영되지 않습니다.  
```js
// app.js
app.get('/', (req, res) => {
  res.send('Hello Docker!')
})
```
위와 같이 코드를 수정했다면 다시 image build가 필요합니다.  


코드 변경없이 image build를 수행하면 이전보다 build 속도가 빨라집니다. 이는 Dockerfile의 각 명령어 결과들이 cache되어 있기 때문입니다.  
아래 실행결과에서 ```Using cache``` 메세지를 확인할 수 있습니다.
```sh
$ docker build .
Sending build context to Docker daemon  2.035MB
Step 1/6 : FROM node
 ---> 058747996654
Step 2/6 : WORKDIR /app
 ---> Using cache
 ---> bae3a71d89f2
Step 3/6 : COPY . /app
 ---> Using cache
 ---> 55beaf93dc38
Step 4/6 : RUN npm install
 ---> Using cache
 ---> 7e92d8417f76
Step 5/6 : EXPOSE 80
 ---> Using cache
 ---> 5b6842f67269
Step 6/6 : CMD ["node", "app.js"]
 ---> Using cache
 ---> 5360ece46743
Successfully built 5360ece46743
```
이 상태에서 ```app.js```를 수정하고 image build를 하면 다음과 같은 결과가 나옵니다.
```sh
$ docker build .
Sending build context to Docker daemon  2.036MB
Step 1/6 : FROM node
 ---> 058747996654
Step 2/6 : WORKDIR /app
 ---> Using cache
 ---> bae3a71d89f2
Step 3/6 : COPY . /app
 ---> 07b5e5de35a5
Step 4/6 : RUN npm install
 ---> Running in 5e078a9b4097
Removing intermediate container 5e078a9b4097
 ---> 097690aa214f
Step 5/6 : EXPOSE 80
 ---> Running in c2143c82356d
Removing intermediate container c2143c82356d
 ---> 8456d62e6f8f
Step 6/6 : CMD ["node", "app.js"]
 ---> Running in ce93bbe7d1c9
Removing intermediate container ce93bbe7d1c9
 ---> 3ad5e4c9db4b
Successfully built 3ad5e4c9db4b
```
코드 수정사항이 발생했기 때문에 Step3에서 cache된 결과물을 사용하지 않는 걸 확인할 수 있습니다.  
Step4~6은 변경사항이 없기 때문에, cache된 결과물을 사용해도 되지만 docker는 이를 알지 못합니다. 따라서 변경사항이 발생한 Step 및 그 이후의 모든 Step에 대해 다시 커맨드를 실행시키게 됩니다.  
build시간을 최적화하기 위해 Dockerfile을 아래와 같이 수정할 수 있습니다.
```sh
FROM node               
WORKDIR /app           
COPY package.json /app  # package.json만 먼저 복사합니다
RUN npm install         # package.json에 명시된 dependency들을 설치합니다
COPY . /app             
EXPOSE 80               
CMD ["node", "app.js"]  
```

## Rerun Container
이전에 실행시켰던 container를 실행시킵니다. (background로 동작합니다)
```sh
$ docker ps -a                        # container 이력을 전부 조회합니다
$ docker start [CONTAINER_ID|NAME]    # container를 재시작합니다
```

```attached mode```로 기존 image를 기반으로 새로운 container를 실행시킵니다. (foreground로 동작합니다)
```sh
$ docker run -p 8000:80 [IMAGE_ID]
```

```detached mode```로 기존 image를 기반으로 새로운 container를 실행시킵니다. (background로 동작합니다)
```sh
$ docker run -p 8000:80 -d [IMAGE_ID]
$ docker attach [CONTAINER_ID|NAME]     # attached mode로 전환합니다
```

## Delete Image/Container
실행중이지 않은 container에 대해서만 삭제할 수 있습니다. container가 실행중이라면 먼저 stop시킨 후 삭제해야 합니다.
```sh
$ docker ps -a                        # container 이력을 전부 조회합니다
$ docker rm [NAME] [NAME]             # 여러개의 container를 동시에 삭제할 수 있습니다
```

image가 stop된 container에서 사용되고 있다면 삭제할 수 없습니다. 
```sh
$ docker images                       # image를 전부 조회합니다
$ docker rmi [IMAGE_ID] [IMAGE_ID]    # 여러개의 image를 동시에 삭제할 수 있습니다
$ docker image prune                  # unused image만 전부 삭제합니다          
```

container가 stop되었을 때 자동으로 삭제되길 원하면 ```--rm``` flag를 활용할 수 있습니다.
```sh
$ docker run -d --rm [IMAGE_ID]
```

## Inspect Image
image에 대한 configuration을 확인하는 명령어는 다음과 같습니다. (exposed port, layer, command 등 다양한 정보들을 포함합니다)
```sh
$ docker image inspect [IMAGE_ID]
```
위에서 작성한 Dockerfile로 build한 image를 inspect해보면 다음과 같이 layer가 구성되어 있음을 확인할 수 있습니다.
```json
  "RootFS": {
      "Type": "layers",
      "Layers": [
          "sha256:e2e8c39e0f77177381177ba8c4025421ec2d7e7d3c389a9b3d364f8de560024f",
          "sha256:91f7336bbfffdab2b558c738b7eeddec9bd8ace8884b3e7b96f3f5bcb643cafa",
          "sha256:d3710de04cb3fb2b3cb30765805f36935699523e75f199975f2b9e827f19e615",
          "sha256:3b441d7cb46b419dbd85417c8710660d24df06309e0e29a22d5467514148a86b",
          "sha256:d4151e7436b11c46423501cd8711e1a55f2f574366c9f8eadced204a2a91b142",
          "sha256:b78f5947ac06610c7f7d1d4fb905e9d5496302f89983f5d7687c3c8c1a7dbf8b",
          "sha256:5fcbd9f9cc1692f68fbccd62aaf7588909b9afe0579d86c12221da239ccbb815",
          "sha256:108db81fd709a610e36caf7bb83dbe4c86ec4b5516746fcd276b88c4b6215bae",
          "sha256:466d2a543f2a9426d15b6584c2a87fcfc2f3b78e1b3a3b59b7669eca05f07369",
          "sha256:ac1a558ed2fb099be0c203eec981dec8d2a589aca013168c11ede27e4870dd29",
          "sha256:592a5cd11939dd93a873dd468c657fb499d835734c182c3cb5c6429fbd1e8b03",
          "sha256:33d616aed36558c4144ded7989ae39c70bedf0a1d591fe53850f1178702a52a1"
      ]
  },
```
Dockerfile내에는 6개의 명령어가 있어서, 6개의 layer만 존재해야 한다고 생각할 수 있지만, ```FROM node```에서 이미 내부적으로 여러개의 layer들을 가지고 있어서 6개 이상의 layer가 출력됩니다.

## Copy files
container와 local간에 file을 복사하고 싶을 때는 ```cp```명령어를 사용하면 됩니다. container내의 log file을 local로 복사할 때 유용합니다.
```sh
# Usage
$ docker cp [LOCAL_FILE] [CONTAINER_NAME]:/[_PATH]
# Example
$ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS         PORTS                                   NAMES
9d52ed29cc98   c269d2d9fba1   "docker-entrypoint.s…"   10 seconds ago   Up 9 seconds   0.0.0.0:3000->80/tcp, :::3000->80/tcp   objective_mayer
$ docker cp test.txt objective_mayer:/test
# container에 제대로 복사되었는지 확인해봅니다
$ docker cp objective_mayer:/test test
```

## Naming&Tagging Image/Container
image와 container에 alias를 부여하면 관리가 쉬워집니다.
- image: ```name:tag```형식으로 tagging할 수 있습니다. name은 group을 정의하고, 일반적으로 tag는 group내에서 version을 정의하는 데 사용됩니다.
- container: naming할 수 있습니다.
```sh
# naming container
$ docker run -p 3000:80 -d --rm --name myapp c269d2d9fba1
$ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                                   NAMES
296e2025b81b   c269d2d9fba1   "docker-entrypoint.s…"   3 seconds ago   Up 2 seconds   0.0.0.0:3000->80/tcp, :::3000->80/tcp   myapp
# tagging image
$ docker build -t myapp:latest .
$ docker ps
REPOSITORY              TAG       IMAGE ID       CREATED         SIZE
myapp                   latest    96f4d80033a2   3 seconds ago   996MB
```
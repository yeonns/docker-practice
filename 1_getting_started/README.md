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

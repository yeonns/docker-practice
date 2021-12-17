# 1. Getting Started

## Create Docker image
Dockerfile을 작성합니다.
```sh
FROM node             # docker hub에서 node 기반 이미지를 사용합니다
WORKDIR /app          # 기본적으로 container 내의 / 디렉토리를 사용하지만, 워킹 디렉토리를 /app 으로 변경합니다
COPY . ./             # local file들을 container내의 /app내로 복사합니다 (COPY . /app 로 작성해도 됩니다)
RUN npm install       # package.json에 명시된 dependency들을 설치합니다
EXPOSE 80             # container내에서 80번 포트를 expose시킵니다. documentation용도로 작성해주는 것이 좋습니다.
CMD ["node", "app.js"]# container내에서 node app.js를 실행시킵니다
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

container를 실행시킵니다. (container내의 80번 port를 local의 3000번 port로 expose시킵니다)  
localhost:3000에서 결과물을 확인할 수 있습니다.
```sh
$ docker run -p 3000:80 6580aeabccfe
# 현재 실행중인 container를 확인할 수 있습니다
$ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS              PORTS                                   NAMES
d765d68373bc   6580aeabccfe   "docker-entrypoint.s…"   2 minutes ago   Up About a minute   0.0.0.0:3000->80/tcp, :::3000->80/tcp   gifted_rhodes
# 실행중인 container를 중지시킵니다 (CONTAINER ID값을 활용)
$ docker stop d765d68373bc
```


# 2. Data Management
data 관리 및 volume에 대해 알아봅니다.

## Data
data는 크게 3가지 종류로 나눌 수 있습니다.
- Application (Code + Environment): 개발자가 작성한 코드로 build시 image에 추가됩니다. image가 한번 빌드되면 변경되지 않습니다, 즉 read-only입니다.
- Temporary App Data: container 실행중에 user input등을 통해 생성되는 데이터로, 메모리나 임시파일에 저장됩니다. read-write가능하고, container내에 저장되는 일시적인 데이터입니다.
- Permanent App Data: container 실행중에 파일이나 DB에 저장되는 데이터로 container가 stop되더라도 잃어버려서는 안되는 데이터입니다. volume으로 저장하는 영구적인 데이터입니다.

## About Example
이름을 입력해서 subscribe하는 간단한 nodeJS application 예제입니다.  
![main](./public/subscribe-app-main.png)  
이전에 구독한 적이 있다면 ```pages/check.html```로 이동하게 됩니다.  
![check](./public/subscribe-app-check.png)  

구독여부를 체크하는 방식은 다음과 같습니다.
```js
// server.js
app.post('/subscribe', async(req, res) => {
  const name = req.body.name;

  const tempFilePath = path.join(__dirname, 'temp', name);
  const finalFilePath = path.join(__dirname, 'subscription', name);

  // input으로 입력한 값에 대해 temp 디렉토리에 파일을 생성합니다
  await fs.writeFile(tempFilePath, "");

  // subscription 디렉토리에 동일한 파일이 있는지 확인합니다
  fs.access(finalFilePath, contstants.F_OK)
    .then(async() => {
      // 이미 구독을 했다면 check.html로 이동합니다
      res.redirect('/check')
    }).catch(async() => {
      // input으로 입력한 값에 대해 subscription 디렉토리에 파일을 생성합니다
      await fs.rename(tempFilePath, finalFilePath);
      res.redirect('/');
    })
});
```

## Run Example with Docker
현재 directory 내의 Dockerfile을 기반으로 image를 생성하고 실행시킵니다.
```sh
$ docker build -t subscribe-app .
...
Successfully built e0d06abaa257
Successfully tagged subscribe-app:latest
$ docker run -p 3000:3000 -d --name node-app --rm subscribe-app
```
localhost:3000에서 'Jenny'라는 이름으로 Subscribe를 수행하면 container내의 ```temp/``` 및 ```subscription/``` 디렉토리 내에 'Jenny'가 저장됩니다.
다시 container를 stop시키고 새로 실행시켜보겠습니다. 이번에는 ```--rm```옵션 없이 실행시키겠습니다.
```sh
$ docker stop node-app
$ docker run -p 3000:3000 -d --name node-app subscribe-app
```
container를 삭제한 후 새로 실행시켰기 때문에, 이전에 Subscribe했던 내역(Jenny)은 남아있지 않습니다.  
이 상태에서 Jenny를 Subscribe한 후 다시 컨테이너를 재시작해보면, 이번에는 container를 재활용했기 때문에 Jenny라는 구독정보가 남아있는 걸 확인할 수 있습니다.
```sh
$ docker stop node-app
$ docker start node-app # node-app 컨테이너를 재활용합니다
```
container내에서 생성한 데이터는 container가 **삭제되기 전까지** 읽기/쓰기가 가능한 container-layer에 저장됩니다. 하지만 실제 애플리케이션에서는 container가 삭제되더라도
이전에 생성했던 구독정보가 사라져서는 안됩니다. 이 문제는 volume을 활용하여 해결할 수 있습니다.

## Volume
volume은 container의 데이터와 host machine의 directory를 매핑시켜 영구적으로 데이터가 저장되도록 해줍니다. 즉, container가 재시작되거나, 삭제되더라도 volume내의 데이터는 사라지지 않습니다.
현재 애플리케이션에 volume을 간단하게 추가해보겠습니다.
```sh
# Dockerfile
FROM node:14
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
VOLUME ["/app/subscription"] # volume을 추가합니다
CMD ["node", "server.js"]

# Run
$ docker build -t subscribe-app:volumes .
$ docker run -p 3000:3000 -d --name node-app --rm subscribe-app:volumes   # volume을 추가했으니 --rm옵션을 넣어도 됩니다

# localhost:3000에서 Jenny로 Subscribe를 해봅시다
# Rerun
$ docker stop node-app
$ docker run -p 3000:3000 -d --name node-app --rm subscribe-app:volumes
```
volume을 추가했지만, container를 삭제 후 다시 실행시켰을 때 구독정보가 남아있지 않습니다. 그리고 container를 stop한 후에는 volume이 남아있지 않습니다. 왜그럴까요? 
```sh
# volume은 잘 생성되어 있습니다
$ docker volume ls
DRIVER    VOLUME NAME
local     95a15227a383770be36a7e6d89a169001fbee651f7b24a957227490d739ee8bb
$ docker stop node-app
# container를 stop시킨 후, 조회하면 volume이 조회되지 않습니다.
$ docker volume ls
DRIVER    VOLUME NAME
```

volume은 docker에 의해 관리되기 때문에 host machine내의 어떤 위치에 실제로 존재하는지 사용자는 알 수 없습니다. 그리고 이름을 지정하는 방식에 따라 anonymous volume과 named volume으로 구분할 수 있습니다.
- anonymous volume: 이름을 지정하지 않은 volume입니다. docker가 임의로 고유한 이름을 부여합니다. ```--rm```옵션으로 띄운 container가 shut down되면 사라집니다.
  - ```--rm```옵션이 없다면 container를 재실행시킬 때마다, 새로운 anonymous volume이 생성되기 때문에 수동으로 삭제해주어야 합니다. (```docker volume rm VOLUE_NAME``` or ```docker volume prune```)
- named volume: 이름을 명시적으로 지정한 volume입니다. container가 shutdown되더라도 살아있으며, volume내의 데이터는 persistent합니다.  
위에서 우리가 volume을 생성한 방식은 anonymous입니다. 따라서 container를 stop시킨 후에 volume이 조회되지 않았던 것입니다. 우리가 의도한대로 volume을 사용하기 위해서는 named volume을 생성해야합니다.  
named volume은 Dockerfile로 생성할 수 없습니다. 따라서 Dockerfile내의 ```VOLUME ["/app/subscription"]```을 삭제하고, container를 실행시킬 때 함께 volume을 생성해야 합니다.
```sh
# Dockerfile에서 VOLUME command를 삭제하고 이미지를 재빌드합니다
$ docker rmi subscribe-app:volumes
$ docker build -t subscribe-app:volumes .
# named volume 생성 및 container를 실행시킨 후, Jenny를 Subscribe합니다 (-v VOLUME_NAME:PATH로 생성합니다)
$ docker run -p 3000:3000 -d --name node-app -v subscription:/app/subscription --rm subscribe-app:volumes 
$ docker stop node-app
# volume이 살아있습니다
$ docker volume ls
DRIVER    VOLUME NAME
local     subscription
# 다시 실행시킨 후, Jenny를 Subscribe하면 check.html로 이동하며, 정상동작함을 확인할 수 있습니다.
$ docker run -p 3000:3000 -d --name node-app -v subscription:/app/subscription --rm subscribe-app:volumes 
```


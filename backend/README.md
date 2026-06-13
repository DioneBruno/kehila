<div align="center">

# kehila - Backend

</div>

### Docker

Instalando docker e Docker Compose

```bash
sudo apt update

sudo apt upgrade -y

sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER

newgrp docker

```

### Aplicação

Dentro da pasta backend

```bash
docker compose -p kehila -f docker-compose-dev.yml up --force-recreate
docker exec kehila-backend npm run migration:run
docker exec kehila-backend npm run seed:run
```

### Testes

```bash
npm run test
npm run test:watch
npm run test:nomeModulo --watch
npm run test:e2e
npm run test:cov
```

### Gerando Imagem

```bash
docker build -t registry.owlcode.com.br/kehila-backend:latest -f Dockerfile.dev .
docker push registry.owlcode.com.br/kehila-backend:latest
```

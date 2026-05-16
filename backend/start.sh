#!/bin/bash

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

npm install

#npm run migration:run #
npm run start:dev # rodar aplicação
# tail -f /dev/null
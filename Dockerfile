FROM node:22-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

# To ensure that all of the application files are owned by the non-root node user, including the contents
# of the node_modules directory, switch the user to node before running npm install
USER node

RUN npm ci

# ensure that the application files are owned by the non-root node user
COPY --chown=node:node ./dist .

CMD [ "node", "index.js" ]

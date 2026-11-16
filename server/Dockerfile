FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && ln -s /usr/bin/python3 /usr/local/bin/python \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --chown=node:node . .

RUN chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 5000

CMD ["npm", "start"]

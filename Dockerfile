# ---- Build stage ----
FROM node:26 AS build

# Python, make, and g++ are needed for node-gyp to compile native modules
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python-is-python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/TundraBot
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:26-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/TundraBot
COPY --from=build /app/TundraBot/node_modules ./node_modules
COPY --from=build /app/TundraBot/dist ./dist
COPY package.json package-lock.json ./

# We need to do this to properly pass on shutdown signals
CMD ["node", "dist/TundraBot.js"]
# CMD ["npm", "run", "start"]

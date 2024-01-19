FROM node:16

RUN apt-get update
RUN apt-get install -y ffmpeg
WORKDIR /app/TundraBot
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build

# We need to do this to properly pass on shutdown signals
CMD ["node", "dist/TundraBot.js"]
# CMD ["npm", "run", "start"]
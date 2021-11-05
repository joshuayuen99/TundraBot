# Installation

These instructions will get you a copy of the bot up and running on your environment for development and testing purposes. If you're looking for a cloud hosting solution, you can get a free $100 when you sign up for Digital Ocean with [my referral code](https://m.do.co/c/651b659c420e)! A $5/mo droplet should be more than enough for a self-hosted version of TundraBot.

If you'd like to just use my bot on your server without setting anything up yourself, invite my bot to your Discord server [here](https://discord.com/api/oauth2/authorize?client_id=647196546492006423&permissions=259241012342&scope=bot%20applications.commands)!

## Prerequisites

![node-current](https://img.shields.io/badge/node-%3E%3D16.6.0-brightgreen?style=flat)
![NPM Version](https://img.shields.io/badge/npm-%3E%3Dv7.19.1-blue?style=flat)

### [Node.js v16.6.x+](https://nodejs.org/en/download)

When installing Node.js, make sure you check the box to install Python and Visual Studio Build Tools:

![Node.js Setup](/images/node_setup.png)

If you are having trouble with installing npm packages, not having Python or Visual Studio Build Tools is likely the issue.

To check if you have Node.js installed, run this command in your terminal:
```
node -v
```

### [FFmpeg](https://www.ffmpeg.org)

To install on Debian/Ubuntu, run this command in your terminal:

```
sudo apt-get install ffmpeg
```

To install on Windows:

- Download FFmpeg from [here](https://ffmpeg.zeranoe.com/builds) (latest version should work fine)
- Unzip the .zip file with a tool such as [7-Zip](https://www.7-zip.org)
- Save the resulting `ffmpeg` folder wherever you want to keep it
- Add the absolute path of the `bin` folder within your new `ffmpeg` folder to your computer's [environment variables](https://www.howtogeek.com/118594/how-to-edit-your-system-path-for-easy-command-line-access)

![Setting up environment variables](/images/environment_variables.png)

To check if you have FFmpeg installed, run this command in your terminal:
```
ffmpeg -version
```

# Installing

Download or clone this repository with the command:
```
git clone https://github.com/joshuayuen99/TundraBot.git
```

Navigate to the newly created `TundraBot` directory and type the following command:
```
npm install
```

You are likely to get a ton of errors that look fatal, however this won't affect the bot functioning at all—that's all for installing!

# Setting Up the Bot

## Setting up your Discord API Token

To start using the bot, you will first need to generate a Discord API token.

1) Visit https://discord.com/developers/applications and log in to your Discord account.
2) Click "New Application" at the top right and give it a name.
3) Click the "Bot" tab on the left.
4) Click the "Add Bot" button at the top right and give it a name.
5) Where it says "Token", click the "Copy" button.
6) Open up the `.env` file in your `TundraBot` directory and paste your token after `DISCORDTOKEN =`
7) Click the "OAuth2" tab on the left.
8) Where it says "Client Secret", click the "Copy" button.
9) In the `.env` file, paste your secret after `BOT_SECRET =`

## Setting Up the Database

For the bot to function properly, you'll need to set up its MongoDB database. For TundraBot, I use the free tier of [MongoDB Atlas](https://www.mongodb.com/atlas/database).

1) You'll want to visit https://www.mongodb.com/atlas/database and make an account.
2) Create a new project.
3) Under the "Atlas" tab, you'll want to create a new database. Take note of the name you give it.
4) Under your new database, click the "Connect" button.
5) When choosing your connection method, choose "Connect your application".
6) Select "Node.js" as your driver and "4.0 or later" as your driver.
7) In the `.env` file, you'll need to fill in the `MONGOOSE` options with the appropriate fields:
    - `MONGOOSE_URL`: the URL following the `@` up until the first `/`, eg. `cluster0.1abcd.mongodb.net`
    - `MONGOOSE_USERNAME`: the username of your MongoDB Atlas account
    - `MONGOOSE_PASSWORD`: the password of your MongoDB Atlas account
    - `MONGOOSE_DB`: the name of the database that you created previously

## Enabling Owner-only Commands

Only the Discord ID of the user specified in the `.env` file will be able to run owner-only commands.

1) Edit the `OWNERID` option in the `.env` file to your own.
2) Optionally edit the `OWNERNAME` and `OWNERTAG` options.

# Starting the Bot

Once you've set up your Discord API key, you're ready to start the bot.

To build the bot, navigate to your `TundraBot` directory and enter the command:
```
npm run build
```

To finally start the bot, enter the command:
```
npm run start
```

## Inviting the Bot to Servers

1) Visit https://discord.com/developers/applications and log in to your Discord account.
2) Click on your newly created project.
3) Click the "OAuth2" tab on the left.
4) Under "Scopes", check the "bot" and "applications.commands" boxes.
5) Check all the permissions you want your bot to request upon joining a new server (the server owner will still have to agree to these upon the bot joining). The following are the bare minimum permissions the bot needs to function properly, but checking "Administrator" is a safe bet to make sure it has everything it needs.

![Bot Permissions](/images/bot_permissions.png)

You're done! All you need now is to copy the link at the bottom of the "Scopes" section and share that with any server owner that wants to use the bot.
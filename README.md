<h1 align="center">@akarui/aoi.invite</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@akarui/aoi.invite">
    <img src="https://img.shields.io/npm/v/@akarui/aoi.invite?style=for-the-badge"  alt="aoiinvite"/>
  </a>
  <a href="https://www.npmjs.com/package/@akarui/aoi.invite">
    <img src="https://img.shields.io/npm/dt/@akarui/aoi.invite?style=for-the-badge"  alt="aoiinvite"/>
  </a>

## Installation

```sh
npm i @akarui/aoi.invite
```

## Example Usage

```js
const {AoiClient} = require("aoi.js");

const client = new AoiClient({
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"],
    prefix: "Discord Bot Prefix",
    token: "Discord Bot Token",
    database: {
        type: "aoi.db",
        db: require("@akarui/aoi.db"),
        dbType: "KeyValue",
        tables: ["main"],
        securityKey: "a-32-characters-long-string-here",
    }
});

// Ping Command
client.command({
    name: "ping",
    code: `Pong! $pingms`
});

const { InviteManager } = require("@akarui/aoi.invite");
const i = new InviteManager(bot,{
    sk: "a-32-characters-long-string-here",
},['inviteJoin','inviteLeave']);
```
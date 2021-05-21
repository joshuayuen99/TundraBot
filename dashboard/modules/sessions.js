const authClient = require("./auth-client");
const { client } = require("../../index");

const sessions = new Map();

async function get(key) {
    let data = sessions.get(key);
    if (data === undefined) data = await create(key);
    return data;
}

async function create(key) {
    setTimeout(() => sessions.delete(key), 5 * 60 * 1000); // 5 mins
    await update(key);

    return sessions.get(key);
}

async function update(key) {
    return sessions
        .set(key, {
            authUser: await authClient.getUser(key),
            authGuilds: getManageableGuilds(await authClient.getGuilds(key))
        });
}

function getManageableGuilds(authGuilds) {
    const guilds = [];
    // loop through all the servers the user is in
    for (const id of authGuilds.keys()) {
        // check the user has MANAGE_GUILD permissions
        if (!authGuilds.get(id).permissions.includes("MANAGE_GUILD")) continue;

        const guild = client.guilds.cache.get(id);
        if (!guild) continue; // check that the bot is in the server as well
        guilds.push(guild);
    }

    return guilds;
}

module.exports.get = get;
module.exports.update = update;
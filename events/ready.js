module.exports = (client) => {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "music ~play | ~help",
            type: "PLAYING",
        }
    });

    console.log(`I'm now online, my name is ${client.user.username}`);
};
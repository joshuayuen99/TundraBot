module.exports = class Command {
    constructor(client, {
        name = null,
        aliases = [],
        category = null,
        enabled = true,
        guildOnly = true,
        botPermissions = [],
        memberPermissions = [],
        ownerOnly = false,
        cooldown = 2000, // 2 seconds
    }) {
        this.client = client;
        this.conf = { name, aliases, category, enabled, guildOnly, botPermissions, memberPermissions, ownerOnly, cooldown };
    }
};
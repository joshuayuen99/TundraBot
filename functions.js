module.exports = {
    getMember: function(message, toFind = '') {
        toFind = toFind.toLowerCase();

        let target = message.guild.members.get(toFind);

        // If there is no target, but there is a mention in the message, use the first mention instead
        if(!target && message.mentions.members) {
            target = message.mentions.members.first();
        }

        // Searches for people in the server with a matching nickname or tag
        if(!target && toFind) {
            target = message.guild.members.find(member => {
                return member.displayName.toLowerCase().includes(toFind) ||
                member.user.tag.toLowerCase().includes(toFind);
            });
        }

        // If no one is found that matches, return the callee
        if(!target) {
            target = message.member;
        }

        return target;
    },

    formatDate: function(date) {
        return new Intl.DateTimeFormat("en-US").format(date);
    }
};
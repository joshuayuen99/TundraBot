const { id } = require("common-tags");
const express = require("express");
const { Message } = require("../../models");
const { validateGuild } = require("../modules/middleware");
const client = {};
require("../../utils/mongooseFunctions")(client);

const router = express.Router();

router.get("/dashboard", (req, res) => {
    res.render("dashboard/index");
});

router.get("/servers/:id", validateGuild, async (req, res) => {
    res.render("dashboard/show", {
        savedGuild: await client.getGuild({ id: req.params.id }),
        commandCounts: await Message.aggregate([
            {
              '$match': {
                'guildID': req.params.id,
                'command': {
                  '$ne': ''
                }
              }
            }, {
              '$group': {
                '_id': '$command', 
                'count': {
                  '$sum': 1
                }
              }
            }
          ])
    });
});

router.put("/servers/:id/:module", validateGuild, async (req, res) => {
    try {
        const { id, module } = req.params;

        if (module == "general") {
            console.log(req.body);
            if (!req.body.blacklistedChannelIDs) {
                req.body.blacklistedChannelIDs = [];
            }
            await client.updateGuild({ id: id }, req.body)
        }

        res.redirect(`/servers/${id}`);
    } catch (err) {
        res.render("errors/400");
        console.log(err);
    }
});

module.exports = router;
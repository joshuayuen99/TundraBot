const express = require("express");
const { commands } = require("../../index");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index", {
        subtitle: "Home"
    });
});

router.get("/commands", (req, res) => {
    res.render("commands", {
        subtitle: "Commands",
        categories: [
            { name: "Music", icon: "fas fa-music" },
            { name: "Info", icon: "fas fa-question-circle" },
            { name: "Moderation", icon: "fas fa-gavel" },
            { name: "Utility", icon: "fas fa-tools" },
            { name: "Fun", icon: "fas fa-star" }],
        commands: commands.array(),
        commandsString: JSON.stringify(commands.array())
    });
});

module.exports = router;
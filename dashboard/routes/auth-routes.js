const express = require("express");
const authClient = require("../modules/auth-client");
const sessions = require("../modules/sessions");

const router = express.Router();

router.get("/invite", (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=1383328886&redirect_uri=${process.env.DASHBOARD_URL}/auth-guild&response_type=code&scope=bot`);
});

router.get("/login", (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&redirect_uri=${process.env.DASHBOARD_URL}/auth&response_type=code&scope=identify%20guilds`);
});

router.get("/auth-guild", async (req, res) => {
    const key = res.cookies.get("key");
    if (key) {
        await sessions.update(key);
        res.redirect("/dashboard");
    } else {
        res.redirect("/login");
    }
});

router.get("/auth", async (req, res) => {
    const code = req.query.code;
    try {
        await authClient.getAccess(code)
        .then((key) => {
            res.cookies.set("key", key);

            res.redirect("/dashboard");
        }).catch((err) => {
            console.error(`${err.statusCode} :: ${err.message}`);
            res.render("errors/400");
        });
    } catch (err) {
        res.redirect("/");
    }
});

router.get("/logout", (req, res) => {
    res.cookies.set("key", "");

    res.redirect("/");
});

module.exports = router;
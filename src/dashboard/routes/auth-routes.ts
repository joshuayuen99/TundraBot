import express, { Router } from "express";
import { TundraBot } from "../../base/TundraBot";
import Deps from "../../utils/deps";
import AuthClient from "../modules/auth-client";
import Sessions from "../modules/sessions";
import { Route } from "./Route";

export default class AuthRoutes extends Route {
    router: Router;
    sessions: Sessions;
    AuthClient: AuthClient;
    constructor(client: TundraBot) {
        super(client);

        this.router = express.Router();
        this.sessions = Deps.get<Sessions>(Sessions);
        this.AuthClient = Deps.get<AuthClient>(AuthClient);

        this.router.get("/invite", (req, res) => {
            res.redirect(
                `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=1383328886&redirect_uri=${process.env.DASHBOARD_URL}/auth-guild&response_type=code&scope=bot`
            );
        });

        this.router.get("/login", (req, res) => {
            res.redirect(
                `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&redirect_uri=${process.env.DASHBOARD_URL}/auth&response_type=code&scope=identify%20guilds`
            );
        });

        this.router.get("/auth-guild", async (req, res) => {
            const key = res.cookies.get("key");
            if (key) {
                await this.sessions.update(key);
                res.redirect("/dashboard");
            } else {
                res.redirect("/login");
            }
        });

        this.router.get("/auth", async (req, res) => {
            const code = req.query.code;
            try {
                await this.AuthClient.authClient
                    .getAccess(code)
                    .then((key) => {
                        res.cookies.set("key", key);

                        res.redirect("/dashboard");
                    })
                    .catch((err) => {
                        console.error(`${err.statusCode} :: ${err.message}`);
                        res.render("errors/400");
                    });
            } catch (err) {
                res.redirect("/");
            }
        });

        this.router.get("/logout", (req, res) => {
            res.cookies.set("key", "");

            res.redirect("/");
        });
    }
}
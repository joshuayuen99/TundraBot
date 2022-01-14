import express from "express";
import https from "https";
import cookies from "cookies";
import bodyParser from "body-parser";
import methodOverride from "method-override";

import Middleware from "./modules/middleware";
import Sessions from "./modules/sessions";
import RootRoutes from "./routes/root-routes";
import AuthRoutes from "./routes/auth-routes";
import DashboardRoutes from "./routes/dashboard-routes";
import Logger from "../utils/logger";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import AuthClient from "./modules/auth-client";
import { readFileSync } from "fs";

export default class Server {
    client: TundraBot;
    sessions: Sessions;
    middleware: Middleware;
    AuthRoutes: AuthRoutes;
    DashboardRoutes: DashboardRoutes;
    RootRoutes: RootRoutes;
    constructor(client: TundraBot) {
        this.client = client;
        Deps.buildWithClient(client, AuthClient, Sessions, Middleware);
        this.sessions = Deps.get<Sessions>(Sessions);
        this.middleware = Deps.get<Middleware>(Middleware);

        Deps.buildWithClient(client, AuthRoutes, DashboardRoutes, RootRoutes);
        this.AuthRoutes = Deps.get<AuthRoutes>(AuthRoutes);
        this.DashboardRoutes = Deps.get<DashboardRoutes>(DashboardRoutes);
        this.RootRoutes = Deps.get<RootRoutes>(RootRoutes);

        const app = express();

        app.set("client", this.client);
        app.set("sessions", this.sessions);

        app.set("views", __dirname + "/views");
        app.set("view engine", "pug");

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(methodOverride("_method"));
        app.use(cookies.express(["a", "b", "c"]));

        app.use(express.static(`${__dirname}/assets`));
        app.locals.basedir = `${__dirname}/assets`;

        app.use(
            "/",
            this.middleware.updateUser,
            this.RootRoutes.router,
            this.AuthRoutes.router,
            this.middleware.validateUser,
            this.middleware.updateGuilds,
            this.DashboardRoutes.router
        );

        app.use("*", (req, res) => {
            res.render("errors/404");
        });

        const certificate = readFileSync(process.env.CERTIFICATE_PATH);
        const privateKey = readFileSync(process.env.PRIVATE_KEY_PATH);

        https.createServer({
            cert: certificate,
            key: privateKey
        }, app).listen(process.env.DASHBOARD_PORT, () => {
            Logger.log("ready", `The web server is live on port ${process.env.DASHBOARD_PORT}!`);
        });
    }
}

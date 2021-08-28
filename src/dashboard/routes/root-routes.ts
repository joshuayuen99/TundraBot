import express, { Router } from "express";
import { TundraBot } from "../../base/TundraBot";
import { Route } from "./Route";

export default class RootRoutes extends Route {
    router: Router;
    constructor(client: TundraBot) {
        super(client);
        this.router = express.Router();

        this.router.get("/", (req, res) => {
            res.render("index", {
                subtitle: "Home"
            });
        });
        
        this.router.get("/commands", (req, res) => {
            const commands = [...this.client.commands.values()];

            res.render("commands", {
                subtitle: "Commands",
                categories: [
                    { name: "Music", icon: "fas fa-music" },
                    { name: "Info", icon: "fas fa-question-circle" },
                    { name: "Moderation", icon: "fas fa-gavel" },
                    { name: "Utility", icon: "fas fa-tools" },
                    { name: "Fun", icon: "fas fa-star" }],
                commands: commands,
                commandsString: JSON.stringify(commands)
            });
        });
    }
}
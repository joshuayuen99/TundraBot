import { TundraBot } from "../base/TundraBot";
import { memberModel } from "../models/Member";
import { soundEffectInterface, soundEffectModel } from "../models/SoundEffect";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export interface MemberSoundEffects {
    joinSoundEffect: soundEffectInterface | void,
    leaveSoundEffect: soundEffectInterface | void,
}

export default class LoadMemberSoundEffects extends StartupHelper {
    constructor(client: TundraBot) {
        super(client);
    }

    async init(): Promise<void> {
        memberModel
            .find({
                $or: [
                    {
                        "settings.joinSoundEffect": {
                            $exists: true,
                            $ne: null,
                        },
                    },
                    {
                        "settings.leaveSoundEffect": {
                            $exists: true,
                            $ne: null,
                        },
                    },
                ],
            })
            .then(async (members) => {
                for (const member of members) {
                    const joinSoundEffect = await soundEffectModel.findById(
                        member.settings.joinSoundEffect
                    ).catch((err) => {
                        Logger.log("error", `Error loading sound effect (${member.settings.joinSoundEffect}) from loadMemberSoundEffect.ts:\n${err}`);
                    });

                    const leaveSoundEffect = await soundEffectModel.findById(
                        member.settings.leaveSoundEffect
                    ).catch((err) => {
                        Logger.log("error", `Error loading sound effect (${member.settings.joinSoundEffect}) from loadMemberSoundEffect.ts:\n${err}`);
                    });

                    const soundEffects = {
                        joinSoundEffect: joinSoundEffect,
                        leaveSoundEffect: leaveSoundEffect,
                    } as MemberSoundEffects;

                    // load into cache
                    this.client.databaseCache.memberSoundEffects.set(
                        `${member.guildID}${member.userID}`,
                        soundEffects
                    );
                }
                Logger.log("ready", `Loaded ${members.length} members' soundEffects`);
            });
    }
}
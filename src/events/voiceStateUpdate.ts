import { VoiceState } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import { TundraBot } from "../base/TundraBot";
import Soundboard from "../commands/music/soundboard";
import Deps from "../utils/deps";

export default class MessageReactionAddHandler extends EventHandler {
    SoundboardCommand: Soundboard;
    constructor(client: TundraBot) {
        super(client);
        this.SoundboardCommand = Deps.get<Soundboard>(Soundboard);
    }

    async invoke(oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (!newState.guild.available) return;

        if (oldState.member.user.bot || newState.member.user.bot) return;

        if (oldState.channel && !newState.channel) {
            // Left channel
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${oldState.guild.id}${oldState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.leaveSoundEffect) {
                this.SoundboardCommand.queueEffect(this.client, oldState.guild.id, oldState.channel, memberSoundEffects.leaveSoundEffect);
                // TODO: reimplement with Discord.js v13
                // const dummyMessage = new Message(this.client, null, null);
                // this.client.player.play()
            }
        } else if (!oldState.channel && newState.channel) {
            // Joined channel
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${newState.guild.id}${newState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.joinSoundEffect) {
                this.SoundboardCommand.queueEffect(this.client, newState.guild.id, newState.channel, memberSoundEffects.joinSoundEffect);
                // TODO: reimplement with Discord.js v13
                // const dummyMessage = new Message(this.client, null, null);
                // this.client.player.play()
            }
        }
    }
}

import { Guild, Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface soundEffectInterface extends Document {
    name: string;
    link: string;
    guildID: Snowflake;

    createdAt: Date;
    updatedAt: Date;
}

const soundEffectSchema = new Schema<soundEffectInterface>(
    {
        name: String,
        link: String,
        guildID: String,
    },
    { timestamps: true }
);

export const soundEffectModel = model<soundEffectInterface>(
    "SoundEffect",
    soundEffectSchema
);

export class DBSoundEffect extends DBWrapper<
    Partial<soundEffectInterface>,
    soundEffectInterface
> {
    protected async getOrCreate(
        soundEffect: Partial<soundEffectInterface>
    ): Promise<soundEffectInterface> {
        const savedSoundEffect = this.getNoCreate(soundEffect);

        return savedSoundEffect ?? this.create(soundEffect);
    }

    async create(
        soundEffect: Partial<soundEffectInterface>
    ): Promise<soundEffectInterface> {
        const newSoundEffect = new soundEffectModel(soundEffect);

        return newSoundEffect.save().then((newSoundEffect) => {
            // Update cache
            this.client.databaseCache.soundEffects.set(
                `${newSoundEffect.guildID}${newSoundEffect.name}`,
                newSoundEffect
            );

            return newSoundEffect;
        });
    }

    async getNoCreate(
        soundEffect: Partial<soundEffectInterface>
    ): Promise<soundEffectInterface> {
        // Check cache first
        if (
            this.client.databaseCache.soundEffects.has(
                `${soundEffect.guildID}${soundEffect.name}`
            )
        )
            return this.client.databaseCache.soundEffects.get(
                `${soundEffect.guildID}${soundEffect.name}`
            );

        const savedSoundEffect = await soundEffectModel.findOne({
            name: soundEffect.name,
            guildID: soundEffect.guildID,
        });

        // Update cache
        this.client.databaseCache.soundEffects.set(
            `${soundEffect.guildID}${soundEffect.name}`,
            savedSoundEffect
        );

        return savedSoundEffect;
    }

    async delete(soundEffect: soundEffectInterface): Promise<void> {
        return soundEffect.delete().then(() => {
            this.client.databaseCache.soundEffects.delete(
                `${soundEffect.guildID}${soundEffect.name}`
            );
        });
    }

    async save(
        soundEffect: soundEffectInterface
    ): Promise<soundEffectInterface> {
        return soundEffect.save().then((soundEffect) => {
            this.client.databaseCache.soundEffects.delete(
                `${soundEffect.guildID}${soundEffect.name}`
            );
            this.client.databaseCache.soundEffects.set(
                `${soundEffect.guildID}${soundEffect.name}`,
                soundEffect
            );

            return soundEffect;
        });
    }

    async getGuildSoundEffects(guild: Guild): Promise<soundEffectInterface[]> {
        const savedSoundEffects = await soundEffectModel.find({
            guildID: guild.id,
        });

        // Update cache
        for (const soundEffect of savedSoundEffects) {
            this.client.databaseCache.soundEffects.set(
                `${soundEffect.guildID}${soundEffect.name}`,
                soundEffect
            );
        }

        return savedSoundEffects;
    }
}

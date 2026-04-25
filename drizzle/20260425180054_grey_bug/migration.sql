CREATE TABLE "channels" (
	"id" bigint PRIMARY KEY,
	"guild_id" bigint,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emojis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" varchar(256) NOT NULL UNIQUE,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emoji_stealer_messages" (
	"emoji_id" uuid,
	"message_id" bigint,
	"guild_emoji_id" bigint NOT NULL,
	"emoji_name" varchar(256) NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emoji_stealer_messages_pkey" PRIMARY KEY("emoji_id","message_id")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" bigint PRIMARY KEY,
	"latest_joined_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"latest_left_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"user_id" bigint,
	"guild_id" bigint,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","guild_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigint PRIMARY KEY,
	"channel_id" bigint NOT NULL,
	"author_id" bigint NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_guild_id_guilds_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id");--> statement-breakpoint
ALTER TABLE "emoji_stealer_messages" ADD CONSTRAINT "emoji_stealer_messages_emoji_id_emojis_id_fkey" FOREIGN KEY ("emoji_id") REFERENCES "emojis"("id");--> statement-breakpoint
ALTER TABLE "emoji_stealer_messages" ADD CONSTRAINT "emoji_stealer_messages_message_id_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_guild_id_guilds_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");
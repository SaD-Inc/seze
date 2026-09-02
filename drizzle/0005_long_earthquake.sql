ALTER TABLE "seze_game_player" ALTER COLUMN "tokenHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "seze_game_player" ADD COLUMN "kind" varchar(16) DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "seze_game" ADD COLUMN "botDifficulty" varchar(16);
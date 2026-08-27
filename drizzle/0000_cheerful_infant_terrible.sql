CREATE TABLE "seze_game_move" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gameId" uuid NOT NULL,
	"moveNumber" integer NOT NULL,
	"playerColor" varchar(16) NOT NULL,
	"pieceId" varchar(16) NOT NULL,
	"from" jsonb NOT NULL,
	"to" jsonb NOT NULL,
	"capturedCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seze_game_player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gameId" uuid NOT NULL,
	"color" varchar(16) NOT NULL,
	"displayName" varchar(24) NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"joinedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seze_game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(8) NOT NULL,
	"status" varchar(16) NOT NULL,
	"rulesetVersion" varchar(32) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seze_game_move" ADD CONSTRAINT "seze_game_move_gameId_seze_game_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."seze_game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seze_game_player" ADD CONSTRAINT "seze_game_player_gameId_seze_game_id_fk" FOREIGN KEY ("gameId") REFERENCES "public"."seze_game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "game_move_number_unique" ON "seze_game_move" USING btree ("gameId","moveNumber");--> statement-breakpoint
CREATE INDEX "game_move_game_idx" ON "seze_game_move" USING btree ("gameId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "game_player_color_unique" ON "seze_game_player" USING btree ("gameId","color");--> statement-breakpoint
CREATE UNIQUE INDEX "game_player_token_unique" ON "seze_game_player" USING btree ("gameId","tokenHash");--> statement-breakpoint
CREATE INDEX "game_player_game_idx" ON "seze_game_player" USING btree ("gameId");--> statement-breakpoint
CREATE UNIQUE INDEX "game_code_unique" ON "seze_game" USING btree ("code");--> statement-breakpoint
CREATE INDEX "game_status_updated_idx" ON "seze_game" USING btree ("status","updatedAt");
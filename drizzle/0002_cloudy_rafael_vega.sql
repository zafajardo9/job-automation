CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"accent" text DEFAULT 'indigo' NOT NULL,
	"text_size" text DEFAULT 'standard' NOT NULL,
	"encrypted_gemini_key" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "target_role" varchar(160);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
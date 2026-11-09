CREATE TABLE "resume_drafts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"draft" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resume_drafts" ADD CONSTRAINT "resume_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
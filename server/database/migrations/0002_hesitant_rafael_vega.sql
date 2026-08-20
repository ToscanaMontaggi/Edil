CREATE TABLE "schedule_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"site_id" text NOT NULL,
	"planned_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_entries_site_id_idx" ON "schedule_entries" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "schedule_entries_date_idx" ON "schedule_entries" USING btree ("date");
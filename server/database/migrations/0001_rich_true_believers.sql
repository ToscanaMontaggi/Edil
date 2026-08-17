CREATE TABLE "fixed_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"amount_cents" bigint DEFAULT 0 NOT NULL,
	"supplier" text DEFAULT '' NOT NULL,
	"document_ref" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fixed_expenses_date_idx" ON "fixed_expenses" USING btree ("date");
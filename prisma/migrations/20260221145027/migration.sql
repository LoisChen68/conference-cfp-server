-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "location" VARCHAR(255),
    "display_name" VARCHAR(100),
    "bio" TEXT,
    "organization" VARCHAR(255),
    "job_title" VARCHAR(100),
    "avatar_url" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_providers" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_links" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "member_providers_provider_provider_user_id_key" ON "member_providers"("provider", "provider_user_id");

-- AddForeignKey
ALTER TABLE "member_providers" ADD CONSTRAINT "member_providers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_links" ADD CONSTRAINT "member_links_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

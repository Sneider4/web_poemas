-- CreateEnum
CREATE TYPE "CommunityPostType" AS ENUM ('POEM', 'OPINION', 'MUSIC');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Santiago',
    "tagline" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL,
    "instagram" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poems" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "type" "CommunityPostType" NOT NULL,
    "content" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_ratings" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "raterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "poems_slug_key" ON "poems"("slug");

-- CreateIndex
CREATE INDEX "poems_published_sortOrder_idx" ON "poems"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "community_posts_hidden_createdAt_idx" ON "community_posts"("hidden", "createdAt");

-- CreateIndex
CREATE INDEX "community_ratings_postId_idx" ON "community_ratings"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "community_ratings_postId_raterHash_key" ON "community_ratings"("postId", "raterHash");

-- AddForeignKey
ALTER TABLE "community_ratings" ADD CONSTRAINT "community_ratings_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

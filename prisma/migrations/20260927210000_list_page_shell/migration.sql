CREATE TABLE "facebook_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "facebookPageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "followerCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "facebook_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "list_pages" (
    "listId" UUID NOT NULL,
    "facebookPageId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "list_pages_pkey" PRIMARY KEY ("listId", "facebookPageId")
);

CREATE UNIQUE INDEX "facebook_pages_facebook_page_id_key" ON "facebook_pages"("facebookPageId");
CREATE INDEX "list_pages_facebook_page_id_idx" ON "list_pages"("facebookPageId");
ALTER TABLE "list_pages" ADD CONSTRAINT "list_pages_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "list_pages" ADD CONSTRAINT "list_pages_facebookPageId_fkey" FOREIGN KEY ("facebookPageId") REFERENCES "facebook_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

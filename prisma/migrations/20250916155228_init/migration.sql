-- CreateTable
CREATE TABLE "InfosGenerales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adresse_site" TEXT NOT NULL,
    "numero_affaire" TEXT NOT NULL,
    "parking_interieur" BOOLEAN NOT NULL,
    "parking_exterieur" BOOLEAN NOT NULL,
    "nombre_parking" INTEGER NOT NULL,
    "nombre_places" INTEGER NOT NULL,
    "prefinancement" BOOLEAN NOT NULL,
    "type_chauffage" TEXT NOT NULL,
    "coffret" TEXT NOT NULL,
    "date_construction" TEXT NOT NULL,
    "date_visite_technique" TEXT NOT NULL,
    "date_ag" TEXT NOT NULL,
    "date_debut_travaux" TEXT NOT NULL,
    "date_fin_travaux" TEXT NOT NULL,
    "moyen_access_copro" TEXT NOT NULL,
    "moyen_access_parking" TEXT NOT NULL,
    "parking_details" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference_enedis" TEXT NOT NULL,
    "adresse_enedis" TEXT NOT NULL,
    "maitre_ouvrage_nom" TEXT NOT NULL,
    "maitre_ouvrage_tel" TEXT NOT NULL,
    "maitre_ouvrage_mail" TEXT NOT NULL,
    "syndic_nom" TEXT NOT NULL,
    "syndic_adresse" TEXT NOT NULL,
    "syndic_interlocteur" TEXT NOT NULL,
    "syndic_tel" TEXT NOT NULL,
    "syndic_mail" TEXT NOT NULL,
    "tiers_mandate_adresse" TEXT NOT NULL DEFAULT '',
    "tiers_mandate_interlocuteur" TEXT NOT NULL DEFAULT '',
    "tiers_mandate_mail" TEXT NOT NULL DEFAULT '',
    "tiers_mandate_nom" TEXT NOT NULL DEFAULT '',
    "tiers_mandate_tel" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Prefinancement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "confection_niche" BOOLEAN NOT NULL,
    "creation_placard" BOOLEAN NOT NULL,
    "creation_tranchee" BOOLEAN NOT NULL,
    "percements" BOOLEAN NOT NULL,
    "pose_socles" BOOLEAN NOT NULL,
    "travaux_specialises" BOOLEAN NOT NULL,
    "pose_armoire" BOOLEAN NOT NULL,
    "deroulage_terre" BOOLEAN NOT NULL,
    "dta" BOOLEAN NOT NULL,
    "amiante" BOOLEAN NOT NULL,
    "pose_canivaux" BOOLEAN NOT NULL,
    "terrassement" BOOLEAN NOT NULL,
    "dta2" BOOLEAN NOT NULL,
    "c15" BOOLEAN NOT NULL,
    "stop_roues" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Material" (
    "id" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("id", "section")
);

-- CreateTable
CREATE TABLE "MaterielInfoTechnique" (
    "id" INTEGER NOT NULL,
    "parking_idx" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("id", "parking_idx", "section")
);

-- CreateTable
CREATE TABLE "InfosTechniquesMeta" (
    "id" INTEGER NOT NULL,
    "parking_idx" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "travees" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageUpload" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parking_idx" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InfosTechniquesMeta_id_parking_idx_key" ON "InfosTechniquesMeta"("id", "parking_idx");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

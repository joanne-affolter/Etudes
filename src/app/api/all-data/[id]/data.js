const tabConfigsInterieur = [
    { key: "raccordement_reseau" },
    { key: "adaptation_colonne" },
    { key: "ouvrage_collectif" },
    { key: "travee" },
    { key: "di" },
    { key: "cables" },
    { key: "travaux_annexes" },
  ];
  
  const tabConfigsExterieur = [
    { key: "extension_reseau_ext" },
    { key: "raccordement_ext" },
    { key: "cable_derivation_collective_ext" },
    { key: "derivation_collective_ext" },
    { key: "di_ext" },
    { key: "travaux_annexes_ext" },
    { key: "di_box_ferme_ext" },
    { key: "di_mur_exterieur_ext" },
    { key: "di_sol_exterieur_ext" },
  ];
  
  const lexique = [
    { name: "CCPC", description: "Coupe Circuit Principal Collectif : permet de couper et de protéger la colonne électrique depuis l'extérieur du bâtiment" },
    { name: "ECP3D", description: "Un CCPC permettant d'alimenter, de couper et de protéger depuis l'extérieur d'un bâtiment deux colonnes électriques séparément." },
    { name: "ECP2D /C400P200", description: "Un CCPC permettant couper et de protéger la colonne électrique depuis l'extérieur d'un bâtiment" },
    { name: "CCPI", description: "Coupe Circuit Principal Individuel : permet de couper et de protéger un raccordement individuel depuis les parties communes." },
    { name: "Pied de colonne", description: "Coffret permettant de couper et de protéger une colonne simple ou multiple à l'intérieur du bâtiment (souvent situé au RDC ou au sous-sol)" },
    { name: "Grille", description: "Permet de relier plusieurs dérivations individuelle ou collectives" },
    { name: "La canalisation horizontale", description: "Câble spécial IRVE horizontal isolé torsadé fixé au plafond par colliers dans le parking intérieur." },
    { name: "Dérivation Individuelle (DI)", description: "Liaison entre la colonne horizontale et le panneau de comptage, 2X25 ou 4X25" },
    { name: "Triphasé", description: "Raccordement d'une puissance allant de 6 KVA à 36 KVA constitué de trois phases et d'un neutre." },
    { name: "Monophasé", description: "Raccordement d'une puissance allant 3KVA à 12 KVA constitué d'une phase et d'un neutre." },
    { name: "Synoptique", description: "Schéma qui décrit les matériels présents dans la colonne horizontale et les raccordements depuis le réseau de distribution" },
    { name: "SPCM", description: "Matériels de protection et de coupure posés en tête d'une travée. Obligatoire à partir de deux travées." },
    { name: "Armoire de comptage", description: "Armoire fournie et posée par le client, permettant d'accueillir le panneau de comptage avec le compteur Linky" },
    { name: "Armoire matériels", description: "Armoire fournie et posée par le client, permettant d'accueillir les matériels de protections (SPCM)" },
    { name: "IRVE", description: "Infrastructure Réseau Véhicule Électrique" },
  ];

  const travauxMapping = {
    confection_niche: { type_de_travaux: "Accueil par le Génie-Civil de l'immeuble de coffrets, armoires, mobilier…", descriptif_technique: "Confection de niche sur façade, encastrement du coffret sur façade, pose de coffret sur mur, etc.", realisation: "ENEDIS" },
    creation_placard: { type_de_travaux: "Accueil par le Génie civil de l'immeuble de canalisation collective ou de travée", descriptif_technique: "Création d’un placard technique", realisation: "ENEDIS" },
    creation_tranchee: { type_de_travaux: "Accueil par le Génie Civil de l'immeuble de canalisation collective ou de travée", descriptif_technique: "Réalisation de tranchée, pose de fourreaux", realisation: "ENEDIS" },
    percements: { type_de_travaux: "Accueil par le Génie Civil de l'immeuble de canalisation collective ou de travée", descriptif_technique: "Percements supérieurs à 50 mm, etc.", realisation: "ENEDIS" },
    pose_socles: { type_de_travaux: "Accueil de la dérivation individuelle dans les parties communes", descriptif_technique: "Fourniture et pose de socles pour accueillir les bornes, etc.", realisation: "ENEDIS" },
    travaux_specialises: { type_de_travaux: "Réalisation de travaux dans le Génie-Civil du bâtiment de l’immeuble pouvant avoir un impact sur sa structure lors de percements, etc.", descriptif_technique: "Études et travaux spécialisés commandés à des prestataires habilités", realisation: "ENEDIS" },
    pose_armoire: { type_de_travaux: "Fourniture et pose de matériels", descriptif_technique: "Fourniture et pose d’armoire, coffret pour l’infrastructure collective, etc.", realisation: "ENEDIS" },
    deroulage_terre: { type_de_travaux: "Reprise du circuit de terre : norme C15-100", descriptif_technique: "Déroulage de la terre C15-100 en partie collective (hors Dérivation Individuelle)", realisation: "ENEDIS" },
    dta: { type_de_travaux: "Travaux de Génie-Civil ci-dessus présentant un seuil d’amiante supérieur aux normes", descriptif_technique: "En fonction du DTA (Dossier Technique d’Amiante) ou si absence de DTA, réalisation d’un RAT (Repérage Avant Travaux)", realisation: "Demandeur" },
    amiante: { type_de_travaux: "Travaux de Génie-Civil ci-dessus présentant un seuil d’amiante supérieur aux normes", descriptif_technique: "Réalisation de travaux en sous-section IV si présence d’amiante", realisation: "Demandeur" },
    pose_caniveaux: { type_de_travaux: "Accueil par le génie civil de l’immeuble de canalisation collective ou de travée", descriptif_technique: "Pose de caniveaux permettant le passage de canalisations électriques, création de dos d’âne sur toit terrasse, etc.", realisation: "Demandeur" },
    terrassement: { type_de_travaux: "Accueil par le génie civil de l’immeuble de canalisation collective ou de travée", descriptif_technique: "Terrassement sur revêtement particulier", realisation: "Demandeur" },
    dta2: { type_de_travaux: "Travaux de Génie-Civil ci-dessus présentant un seuil d’amiante supérieur aux normes", descriptif_technique: "Réalisation DTA (Dossier Technique d’Amiante), placé sous la responsabilité du Demandeur", realisation: "Demandeur" },
    c15: { type_de_travaux: "Création et/ou adaptation de la mise à la terre de l’immeuble", descriptif_technique: "Travaux imposés par la norme C15-100", realisation: "Demandeur" },
    stop_roues: { type_de_travaux: "Accueil par le génie civil d'ouvrages spécifiques", descriptif_technique: "Pose de stop-roues de protection des ouvrages ou arceaux de protection IRVE", realisation: "Demandeur" },
  };

  export { tabConfigsInterieur, tabConfigsExterieur, travauxMapping, lexique };
import { prisma } from "../../../../lib/prisma";
import { tabConfigsInterieur, tabConfigsExterieur, travauxMapping, lexique } from "./data";
import { start } from "repl";



const getRepartitionPhases = (infosTechniquesMeta) => {
    const repartitionPhases = {};
  
    const toPairs = (from, to) => {
      // returns [[start,end], ...]
      const pairs = [];
  
      // Case 1: both numbers
      if (Number.isFinite(from) && Number.isFinite(to)) {
        pairs.push([from, to]);
        return pairs;
      }
  
      // Case 2: both strings — support "a-b" or "a-b, c-d"
      if (typeof from === "string" && typeof to === "string") {
        const fparts = from.split(",").map(s => s.trim()).filter(Boolean);
        const tparts = to.split(",").map(s => s.trim()).filter(Boolean);
        const n = Math.min(fparts.length, tparts.length);
  
        for (let i = 0; i < n; i++) {
          const [fs, fe] = fparts[i].split("-").map(v => parseInt(v, 10));
          const [ts, te] = tparts[i].split("-").map(v => parseInt(v, 10));
  
          // Prefer explicit starts/ends if valid, otherwise fall back
          const start = Number.isFinite(fs) ? fs : ts;
          const end   = Number.isFinite(te) ? te : fe;
  
          if (Number.isFinite(start) && Number.isFinite(end)) {
            pairs.push([start, end]);
          }
        }
      }
  
      return pairs;
    };
  
    infosTechniquesMeta.forEach((meta) => {
      const parkingIdx = (meta.parking_idx ?? 0) + 1;
      const travees = Array.isArray(meta.travees) ? meta.travees : [];
  
      console.log("Processing parking index:", parkingIdx, "with travees:", travees);
  
      travees.forEach((travee, traveeIndex) => {
        const key = `phase_t_${traveeIndex + 1}_${parkingIdx}`;
        const phaseData = [];
  
        if (!travee || (travee.from == null && travee.to == null)) {
          // empty object -> skip
          return;
        }
  
        const pairs = toPairs(travee.from, travee.to);
  
        if (!pairs.length) {
          console.warn(`⚠️ Tranche invalide dans travée ${traveeIndex + 1}, parking ${parkingIdx}:`,
            { from: travee.from, to: travee.to });
        }
  
        for (const [start, end] of pairs) {
          if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
            console.warn(`⚠️ Intervalle invalide: [${start}, ${end}] (travée ${traveeIndex + 1}, parking ${parkingIdx})`);
            continue;
          }
          for (let i = start; i <= end; i++) {
            const positionInTranche = i - start;
            const phase = (positionInTranche % 3) + 1;
            phaseData.push({
              emplacement: i,
              phase_1: phase === 1 ? "x" : "",
              phase_2: phase === 2 ? "x" : "",
              phase_3: phase === 3 ? "x" : "",
            });
          }
        }
  
        if (phaseData.length > 0) {
          repartitionPhases[key] = phaseData;
        }
      });
    });
  
    return repartitionPhases;
  };

const getDescriptionTechnique = (infosTechniquesMeta) => {
    const descriptionTechnique = { description_technique: [] };
    infosTechniquesMeta.forEach((meta) => {
        descriptionTechnique.description_technique.push({
            value: meta.description || "",
        });
    });
    return descriptionTechnique;
};

const flattenMaterielInfoTechnique = (materielInfoTechnique) => {
    const flattened = {};
    materielInfoTechnique.forEach((entry) => {
        const sectionKey = `section_${entry.section}_${entry.parking_idx + 1}`;
        if (entry.items && entry.items.length > 0) {
            flattened[sectionKey] = entry.items;
        }
    });
    return flattened;
}

const flattenMaterials = (materials) => {
    const flattened = {};

    // Process interior sections
    materials
        .filter((mat) => mat.items.some((item) => item.quantity > 0))
        .forEach((mat) => {
            let suffix = "";

            // Check if it belongs to interior or exterior
            if (tabConfigsInterieur.some((tab) => tab.key === mat.section)) {
                suffix = "_interieur";
            } else if (tabConfigsExterieur.some((tab) => tab.key === mat.section)) {
                suffix = "_exterieur";
            } else {
                console.warn(`Unknown section ${mat.section} → no suffix added`);
            }
            const sectionKey = `${mat.section}${suffix}`;

            // Only keep items with quantity > 0
            const filteredItems = mat.items.filter((item) => item.quantity > 0);

            if (filteredItems.length > 0) {
                flattened[sectionKey] = filteredItems;
            }
        });
    return flattened;
}

const normalizeKey = (str) =>
    str
      .normalize("NFD") // decompose accents
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/\s+/g, "_") // replace whitespace with _
      .replace(/[^\w\-]/g, "") // remove non-word chars (keep _ and -)
      .toLowerCase(); // optional: make it all lowercase

const deserializeUrls = (str) => {
    if (!str || str.trim() === "") return [];
    const formalized = str.split(",").map(s => s.trim()).filter(Boolean);
    const res = formalized.map(s => ({ url: s }));
    return res;
};
    
const getImagesandDescriptions = (imagesRaw) => {
    const imagesAndDescriptions = {};
    
    imagesRaw.forEach((img) => {
        const keyBase = `${img.title}_${img.section}_${img.parking_idx}`;
        const normalizedBase = normalizeKey(keyBase);
        const imageKey = `${normalizedBase}_image`;
        const descriptionKey = `${normalizedBase}_description`;
        if (img.fileUrls !== "") {
            imagesAndDescriptions[imageKey] = deserializeUrls(img.fileUrls);
        }
        if (img.description !== "") {
            imagesAndDescriptions[descriptionKey] = img.description;
        }
    });
    return imagesAndDescriptions;
}

const processPrefinancement = (prefinancement) => {
    const processed = [];

    Object.entries(prefinancement).forEach(([key, value]) => {
      if (value === true && travauxMapping[key]) {
        processed.push({
          key,
          ...travauxMapping[key],
        });
      }
    });

    return processed;
  };

// Utility to recursively remove empty values
function removeEmpty(obj) {
    if (Array.isArray(obj)) {
      return obj
        .map(removeEmpty)                // clean children
        .filter(v => !(v === "" || (Array.isArray(v) && v.length === 0))); 
    } else if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj)
          .map(([k, v]) => [k, removeEmpty(v)]) 
          .filter(([_, v]) => !(v === "" || (Array.isArray(v) && v.length === 0)))
      );
    }
    return obj;
  }

export const GET = async (req, { params }) => {
  const id = parseInt(params.id, 10);

  try {

    // Fetch data from all tables
    const project = await prisma.project.findUnique({where: { id }});
    const infosGenerales = await prisma.infosGenerales.findUnique({where: { id }});
    const contacts = await prisma.contact.findMany({where: { id: id }});
    const prefinancement = await prisma.prefinancement.findMany({where: { id }});
    const materials = await prisma.material.findMany({where: { id }});
    const imagesRaw = await prisma.imageUpload.findMany({where: { projectId: id }});
    const materielInfoTechnique = await prisma.materielInfoTechnique.findMany({where: { id }});
    const infosTechniquesMeta = await prisma.infosTechniquesMeta.findMany({where: { id }});
  
    // Get repartition phases
    const repartitionPhases = getRepartitionPhases(infosTechniquesMeta);
    // Get description technique
    const descriptionTechnique = getDescriptionTechnique(infosTechniquesMeta);

    // Flatten materiel info technique
    const flattenedMaterielInfo = flattenMaterielInfoTechnique(materielInfoTechnique);

    // Flatten materials
    const flattenedMaterials = flattenMaterials(materials);
    
    // Get images and descriptions with sanitized keys
    const imagesAndDescriptions = getImagesandDescriptions(imagesRaw);

    // Process prefinancement
    const prefinancement_obj = prefinancement.map(processPrefinancement)[0] || [];

    //console.log("images and descriptions", imagesAndDescriptions);
    console.log("repartitionPhases", repartitionPhases);
    const result = {
      project,
      ...(infosGenerales || {}),
      contacts,
      prefinancement_obj,
      ...descriptionTechnique, 
      ...flattenedMaterials,
      ...imagesAndDescriptions, 
      ...repartitionPhases,
      ...flattenedMaterielInfo, 
      lexique, 
    };
    
    return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
        console.error("Error fetching project data:", error);
        return new Response(
            JSON.stringify({ error: "Failed to retrieve project data" }),
            { status: 500 }
        );
    }
};

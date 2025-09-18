"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, Collapse, Table, InputNumber, Button, Spin, message } from "antd";
import { useParams } from "next/navigation";
import { TypingAnimation } from "../../../../components/ui/typing-animation";
import { SaveButton } from "../../../../components/general/saveButton";
import { generalFetch, generalUpdate } from "../../data";

// Default rows (you said these are already in a separate file)
import {
  RACCORDEMENT_RESEAU, ADAPTATION_PIED_COLONNE, CONSTRUCTION_OUVRAGE_COLLECTIF, TRAVEE,
  DI, CABLES, TRAVAUX_ANNEXES, EXTENSION_RESEAU, RACCORDEMENT, DERIVATION_COLLECTIVE,
  DERIVATION_COLLECTIVE_EXTERIEUR, DI_COFFRET_EXPLOITATION, TRAVAUX_ANNEXES_EXT,
  DI_BOX_FERME, DI_MUR_ETXERIEUR, DI_PARKING_SOL
} from "./data";

/* -------------------- small editable table -------------------- */
function EditableTable({
  rows,
  onChangeCell,
}) {
  const columns = [
    { dataIndex: "name", title: "Nom" },
    {
      dataIndex: "quantity",
      title: "Quantité",
      width: 160,
      render: (_, r) => (
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          value={r.quantity ?? 0}
          onChange={(v) => onChangeCell(r.id, Number(v || 0))}
        />
      ),
    },
  ];
  return (
    <Table
      size="small"
      pagination={false}
      dataSource={(rows || []).map((r, i) => ({ key: r.id ?? i, ...r }))}
      columns={columns}
      style={{ marginBottom: 8 }}
    />
  );
}

/* -------------------- main page -------------------- */
export default function MaterielPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [showInterieur, setShowInterieur] = useState(false);
  const [showExterieur, setShowExterieur] = useState(false);

  // single state for ALL sections
  const DEFAULTS = useMemo(
    () => ({
      // intérieur
      raccordement_reseau: structuredClone(RACCORDEMENT_RESEAU),
      adaptation_colonne: structuredClone(ADAPTATION_PIED_COLONNE),
      ouvrage_collectif: structuredClone(CONSTRUCTION_OUVRAGE_COLLECTIF),
      travee: structuredClone(TRAVEE),
      di: structuredClone(DI),
      cables: structuredClone(CABLES),
      travaux_annexes: structuredClone(TRAVAUX_ANNEXES),
      // extérieur
      extension_reseau_ext: structuredClone(EXTENSION_RESEAU),
      raccordement_ext: structuredClone(RACCORDEMENT),
      cable_derivation_collective_ext: structuredClone(DERIVATION_COLLECTIVE),
      derivation_collective_ext: structuredClone(DERIVATION_COLLECTIVE_EXTERIEUR),
      di_ext: structuredClone(DI_COFFRET_EXPLOITATION),
      travaux_annexes_ext: structuredClone(TRAVAUX_ANNEXES_EXT),
      di_box_ferme_ext: structuredClone(DI_BOX_FERME),
      di_mur_exterieur_ext: structuredClone(DI_MUR_ETXERIEUR),
      di_sol_exterieur_ext: structuredClone(DI_PARKING_SOL),
    }),
    []
  );
  const [sections, setSections] = useState(DEFAULTS);

  // one generic updater
  const makeOnChange = (key) => (rowId, value) =>
    setSections((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((r) => (r.id === rowId ? { ...r, quantity: value } : r)),
    }));

  // tabs config (key + label) to keep render concise
  const tabsInterieur = [
    ["raccordement_reseau", "Raccordement au réseau (hors câble)"],
    ["adaptation_colonne", "Construction adaptation du pied de colonne"],
    ["ouvrage_collectif", "Ouvrages collectifs (hors câble)"],
    ["travee", "Travée (hors câble)"],
    ["di", "Création des DI"],
    ["cables", "Câbles et accessoires installés"],
    ["travaux_annexes", "Travaux Annexes"],
  ];
  const tabsExterieur = [
    ["extension_reseau_ext", "Extension réseau, liaison réseau, etc."],
    ["raccordement_ext", "Raccordement"],
    ["cable_derivation_collective_ext", "Câble dérivation collective (pleine terre)"],
    ["derivation_collective_ext", "Dérivation collective en parking extérieur"],
    ["di_ext", "DI coffret exploitation"],
    ["travaux_annexes_ext", "Travaux Annexes"],
    ["di_box_ferme_ext", "DI box fermé"],
    ["di_mur_exterieur_ext", "DI mur extérieur"],
    ["di_sol_exterieur_ext", "DI sol (extérieur sans mur)"],
  ];

  // load flags (int/ext) and hydrate sections
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const gen = await generalFetch("/api/infos-generales", id);
        setShowInterieur(!!gen?.parking_interieur);
        setShowExterieur(!!gen?.parking_exterieur);

        const materiel_data = await generalFetch("/api/materiel", id);

        // Now, setup sections with fetched data or defaults
        const newSections = { ...DEFAULTS };
        if (Array.isArray(materiel_data)) {
          for (const item of materiel_data) {
            if (item.section && item.items) {
              newSections[item.section] = item.items;
            }
          }
        } else {
          console.warn("Unexpected materiel data format:", materiel_data);
        }
        setSections(newSections);
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, DEFAULTS]);

  // save helpers
  const saveKeys = async (keys) => {
    for (const key of keys) {
        await generalUpdate("/api/materiel", {
            id: parseInt(id, 10),
            section: key,
            items: sections[key] || [],
        });
    }
  };

  const items = [];
  if (showInterieur) {
    items.push({
      key: "int",
      label: <span className="text-lg font-bold">Intérieur</span>,
      forceRender: true,
      children: (
        <>
          <Tabs
            defaultActiveKey={tabsInterieur[0][0]}
            tabPosition="top"
            items={tabsInterieur.map(([key, label]) => ({
              key,
              label,
              children: (
                <EditableTable rows={sections[key] || []} onChangeCell={makeOnChange(key)} />
              ),
            }))}
          />
        </>
      ),
    });
  }
  if (showExterieur) {
    items.push({
      key: "ext",
      label: <span className="text-lg font-bold">Extérieur</span>,
      forceRender: true,
      children: (
        <>
          <Tabs
            defaultActiveKey={tabsExterieur[0][0]}
            tabPosition="top"
            items={tabsExterieur.map(([key, label]) => ({
              key,
              label,
              children: (
                <EditableTable rows={sections[key] || []} onChangeCell={makeOnChange(key)} />
              ),
            }))}
          />

        </>
      ),
    });
  }

  return (
    <div className="p-12">
      <div className="flex justify-center mb-8">
        <TypingAnimation className="text-3xl font-bold text-center">Matériel</TypingAnimation>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" tip="Chargement des données..." />
        </div>
      ) : (
        <>
          <Collapse items={items} defaultActiveKey={items.length ? [items[0].key] : []} />
          <div className="flex justify-start mt-6">
            <SaveButton onSave={() => Promise.all([
              showInterieur ? saveKeys(tabsInterieur.map(([k]) => k)) : Promise.resolve(),
              showExterieur ? saveKeys(tabsExterieur.map(([k]) => k)) : Promise.resolve(),
            ])} />
          </div>
        </>
      )}
    </div>
  );
}

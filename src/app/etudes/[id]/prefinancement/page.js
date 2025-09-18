"use client";
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from "react";
import { Form, Checkbox, Button, Spin, message, Divider } from "antd";
import { TypingAnimation  } from "../../../../components/ui/typing-animation";
import { SaveButton } from "../../../../components/general/saveButton";
import { generalUpdate, generalFetch } from "../../data";


/* ---- Field definitions (unchanged) ---- */
const checkboxFieldsEnedis = [
  { name: "confection_niche", label: "Confection de niche sur façade, encastrement du coffret sur façade, pose de coffret sur mur, etc." },
  { name: "creation_placard", label: "Création d'un placard technique" },
  { name: "creation_tranchee", label: "Création de tranchée, pose de fourreaux" },
  { name: "percements", label: "Percements supérieurs à 50 mm, etc." },
  { name: "pose_socles", label: "Fourniture et pose de socles pour accueillir les bornes, etc." },
  { name: "travaux_specialises", label: "Études et travaux spécialisés commandés à des prestataires habilités" },
  { name: "pose_armoire", label: "Fourniture et pose d'armoire, coffret pour l'infrastructure collective, etc." },
  { name: "deroulage_terre", label: "Déroulage de la terre C15-100 en partie collective (hors Dérivation Individuelle)" },
  { name: "dta", label: "En fonction du DTA (Dossier Technique d'Amiante) ou si absence de DTA, réalisation d’un RAT (Repérage Avant Travaux)" },
  { name: "amiante", label: "Réalisation de travaux en sous-section IV si présence d'amiante" },
];

const checkboxFieldsDemandeur = [
  { name: "pose_canivaux", label: "Pose de caniveaux permettant le passage de canalisations électriques, création de dos d’âne sur toit terrasse, etc." },
  { name: "terrassement", label: "Terrassement sur revêtement particulier" },
  { name: "dta2", label: "Réalisation DTA (Dossier Technique d'Amiante), placé sous la responsabilité du Demandeur" },
  { name: "c15", label: "Travaux imposés par la norme C15-100" },
  { name: "stop_roues", label: "Stop-roues de protections des ouvrages" },
];

/* ---- Default values (all false) ---- */
const defaultValues = [
  ...checkboxFieldsEnedis,
  ...checkboxFieldsDemandeur,
].reduce((acc, f) => ({ ...acc, [f.name]: false }), {});

export default function PrefinancementForm() {
  const { id } = useParams();
    
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // GET
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await generalFetch("/api/prefinancement", parseInt(id, 10));
        console.log("Fetched prefinancement data:", data);
        // Merge defaults to avoid undefined
        form.setFieldsValue({ ...defaultValues, ...(data || {}) });
      } catch (err) {
        console.error(err);
        message.error("Erreur lors du chargement des données.");
        form.setFieldsValue(defaultValues);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, form]);

  // SAVE
  const onSave = async () => {
    const values = await form.validateFields();

    const payload = {
        id: parseInt(id, 10),
        ...values,
        };

    console.log("Saving values:", payload);
    try {
      setLoading(true);
      await generalUpdate("/api/prefinancement", payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-12">
      <div className="flex justify-center mb-8">
        <TypingAnimation className="text-3xl font-bold text-center">Préfinancement</TypingAnimation>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
            <Spin size="large" tip="Chargement des données..." />
        </div>
    ) : (
      <>
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultValues}
        >
            <Divider orientation="left" plain>
                <span className="text-lg font-bold">Travaux annexes — ENEDIS</span>
            </Divider>
            {checkboxFieldsEnedis.map(({ name, label }) => (
              <Form.Item key={name} name={name} valuePropName="checked" style={{ marginBottom: 8 }}>
                <Checkbox>{label}</Checkbox>
              </Form.Item>
            ))}

            <div className="my-15"/>
            <Divider orientation="left" plain>
                <span className="text-lg font-bold">Travaux annexes — DEMANDEUR</span>
            </Divider>
            {checkboxFieldsDemandeur.map(({ name, label }) => (
              <Form.Item key={name} name={name} valuePropName="checked" style={{ marginBottom: 8 }}>
                <Checkbox>{label}</Checkbox>
              </Form.Item>
            ))}

          <div className="flex align-center justify-start mt-10">
            <SaveButton onSave={onSave} />     
          </div>
        </Form>
      
        </>
      )}
    </div>
  );
}

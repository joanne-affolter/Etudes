

"use client"; 

import {React, useState, useMemo, useEffect } from "react";
import { TypingAnimation  } from "../../../../components/ui/typing-animation";

import { Form, Input, Checkbox, Select, DatePicker, Flex, InputNumber, Divider, Radio}  from 'antd';
import { SaveButton } from "../../../../components/general/saveButton";
import { useParams } from 'next/navigation';

import { generalUpdate, generalFetch } from "../../data";
import * as dayjsLib from 'dayjs';
const dayjs = (dayjsLib).default ?? (dayjsLib);

const fmt = (d) => d ? d.format('YYYY-MM-DD') : '';
const toDayjs = (v) => (v ? dayjs(v) : null);

function FormInfos({id, initialValues}) {
    const [form] = Form.useForm();
    
    // Watch how many parking sections to show
    const nbParkings = Form.useWatch('nombre_parking', form) ?? 1;
    const parkingArray = useMemo(() => Array.from({ length: Number(nbParkings) || 0 }), [nbParkings]);


    const mergedInitials = useMemo(() => {
        const iv = initialValues ?? {};
        return {
          adresse_site: iv.adresse_site ?? '',
          numero_affaire: iv.numero_affaire ?? '',
          nombre_parking: iv.nombre_parking ?? 1,
          prefinancement: !!iv.prefinancement,
          type_chauffage: iv.type_chauffage ?? undefined,
          coffret: iv.coffret ?? undefined,
          moyen_access_copro: iv.moyen_access_copro ?? '',
          moyen_access_parking: iv.moyen_access_parking ?? '',
          parking_details: (iv.parking_details ?? []).map((p) => ({
            ...p,
            type: p?.interieur ? 'interieur' : (p?.exterieur ? 'exterieur' : undefined),
          })),
          // Dates from DB are strings; DatePicker expects Dayjs or null
          date_construction: toDayjs(iv.date_construction),
          date_visite_technique: toDayjs(iv.date_visite_technique),
          date_ag: toDayjs(iv.date_ag),
          date_debut_travaux: toDayjs(iv.date_debut_travaux),
          date_fin_travaux: toDayjs(iv.date_fin_travaux),
        };
      }, [initialValues]);
    
    useEffect(() => {
        form.setFieldsValue(mergedInitials);
    }, [form, mergedInitials]);


    const onSave = async () => {
        const v = await form.validateFields();
    
        // derive top-level booleans and total places from details
        const rawDetails  = v.parking_details ?? [];
        const details = rawDetails.map((p) => ({
            ...p,
            interieur: p.type === 'interieur',
            exterieur: p.type === 'exterieur',
        }));
          
        const parking_interieur = details.some((p) => p.interieur);
        const parking_exterieur = details.some((p) => p.exterieur);
        
        const nombre_places = details.reduce(
          (sum, p) => sum + (Number(p?.nombre_places) || 0),
          0
        );
    
        const payload = {
          id: parseInt(id, 10), // pass the id for upsert
          adresse_site: v.adresse_site || '',
          numero_affaire: v.numero_affaire || '',
          parking_interieur,
          parking_exterieur,
          nombre_parking: Number(v.nombre_parking) || 0,
          nombre_places,
          prefinancement: !!v.prefinancement,
          type_chauffage: v.type_chauffage || '',
          coffret: v.coffret || '',
          date_construction: fmt(v.date_construction),
          date_visite_technique: fmt(v.date_visite_technique),
          date_ag: fmt(v.date_ag),
          date_debut_travaux: fmt(v.date_debut_travaux),
          date_fin_travaux: fmt(v.date_fin_travaux),
          moyen_access_copro: v.moyen_access_copro || '',
          moyen_access_parking: v.moyen_access_parking || '',
          parking_details: details, // stays as JSON
        };
        
        try {
            await generalUpdate("/api/infos-generales", payload);
        } catch (e) {
            console.error('Save failed', e);
            return false;
        } 
        return true;
    };

    return (
        <div>
    
        <Form form={form} layout="vertical" requiredMark={true}  >
            <Form.Item name="adresse_site" label="Adresse">
                <Input placeholder="10 rue de la Paix, Paris" />
            </Form.Item>

            <Form.Item name="numero_affaire" label="Numéro d&apos;affaire">
                <Input placeholder="ex: AFF-001" />
            </Form.Item>

            <Form.Item name="nombre_parking" label="Nombre de parkings" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="" name="prefinancement" valuePropName="checked">
                <Checkbox>Préfinancement</Checkbox>
            </Form.Item>

            <div className="my-15"/>

            
            <Form.Item name="moyen_access_copro" label="Moyen d&apos;accès à la copropriété">
                <Input placeholder="ex: Clé, Badge" />
            </Form.Item>

            <Form.Item name="moyen_access_parking" label="Moyen d&apos;accès au parking">
                <Input placeholder="ex: Clé, Badge" />
            </Form.Item>

            <div className="my-15"/>


            <Form.Item label="Type de Chauffage" name="type_chauffage">
            <Select>
                <Select.Option value="Électrique Individuel">Électrique Individuel</Select.Option>
                <Select.Option value="Électrique Collectif">Électrique Collectif</Select.Option>
                <Select.Option value="Gaz Individuel">Gaz Individuel</Select.Option>
                <Select.Option value="Gaz Collectif">Gaz Collectif</Select.Option>
                <Select.Option value="Autre">Autre</Select.Option>
            </Select>
            </Form.Item>

            <Form.Item label="Coffret" name="coffret">
            <Select>
                <Select.Option value="REMBT">REMBT</Select.Option>
                <Select.Option value="ECP2D">ECP2D</Select.Option>
                <Select.Option value="ECP3D">ECP3D</Select.Option>
                <Select.Option value="poste_integre">Poste intégré à l&apos;immeuble</Select.Option>
                <Select.Option value="poste_exterieur">Poste extérieur à l&apos;immeuble</Select.Option>
            </Select>
            </Form.Item>

            <div className="my-15"/>

            <Flex wrap style={{ columnGap: 100, rowGap: 0 }}>

                <Form.Item label="Date de Construction" name="date_construction">
                    <DatePicker className="w-50" />
                </Form.Item>

                <Form.Item label="Date de Visite Technique" name="date_visite_technique">
                    <DatePicker className="w-50"/>
                </Form.Item>

                <Form.Item label="Date AG" name="date_ag">
                    <DatePicker className="w-50"/>
                </Form.Item>

                <Form.Item label="Date Début des Travaux" name="date_debut_travaux">
                    <DatePicker className="w-50"/>
                </Form.Item>

                
                <Form.Item label="Date Fin des Travaux" name="date_fin_travaux">
                    <DatePicker className="w-50"/>
                </Form.Item>
            </Flex>



            {/** Loop over the nb of parking and create a section for each */}
            {parkingArray.map((_, i) => (
                <div key={i}>
                    <div className="my-15"/>

                    <Divider orientation="left" plain>
                        <span className="text-lg font-bold"> Parking {i + 1} </span>
                    </Divider>

                    <Form.Item
                        name={['parking_details', i, 'type']}  // "interieur" | "exterieur"
                        label="Type de parking"
                    >
                    <Radio.Group>
                        <Radio value="interieur">Intérieur</Radio>
                        <Radio value="exterieur">Extérieur</Radio>
                    </Radio.Group>
                    </Form.Item>

                    <Flex wrap style={{ columnGap: 100, rowGap: 0 }}>
                        <Form.Item name={['parking_details', i, 'nombre_places']} label="Nombre de places">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={['parking_details', i, 'puissance']} label="Puissance IRVE (KVA)">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={['parking_details', i, 'travees']} label="Nombre de travées">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={['parking_details', i, 'nb_departs']} label="Nombre de départs">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Flex>

                    
                </div>
            ))}

            <div className="flex align-center justify-start mt-10">
                <SaveButton onSave={onSave} />
                
            </div>
        </Form>
        </div>
    );
}

export default function InfosGeneralesPage() {
    const { id } = useParams();

    // Retrieve initial values for the form, e.g. from an API
    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const data = await generalFetch("/api/infos-generales", id);
            setInitialValues(data);
            console.log("Fetched initial values", data);
        }
        fetchData();
    }, [id]);
    
    return (
        <div className="p-12">
            <div className="flex justify-center mb-8">
            <TypingAnimation className="text-3xl font-bold text-center">Informations Générales</TypingAnimation>
            </div>
            <FormInfos id={id} initialValues={initialValues}/>

        </div>
    )
}
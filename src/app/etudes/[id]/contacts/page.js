
"use client"; 

import {React, useState, useMemo } from "react";
import { TypingAnimation  } from "../../../../components/ui/typing-animation";
import { Form, Input, Select, Divider}  from 'antd';

import { SaveButton } from "../../../../components/general/saveButton";
import { generalUpdate, generalFetch} from "../../data";

import { useParams } from 'next/navigation';
import { useEffect } from "react";

const choicesMaitreOuvrage = [
    { value: 'Lucas CHAUVEAU', label: 'Lucas CHAUVEAU', telephone: '06 99 96 21 90', email: 'lucas.chaveau@enedis.fr' },
    { value: 'Tiphaine WATELLE', label: 'Tiphaine WATELLE', telephone: '06 65 44 87 70', email: 'tiphaine.watelle@enedis.fr' },
    { value: 'Amira ABID', label: 'Amira ABID', telephone: '06 64 17 80 58', email: 'amira-externe.abid@enedis.fr' },
    { value: 'Jennifer DOS SANTOS FERREIRA', label: 'Jennifer DOS SANTOS FERREIRA', telephone: '07 62 68 31 10', email: 'jennifer.dos-santos-ferreira@enedis.fr' },

];
  


function FormContacts({id, initialValues}) {
    const [form] = Form.useForm();

    const onSave = async () => {
        const v = await form.validateFields();
        const mo = choicesMaitreOuvrage.find(c => c.value === v.maitre_ouvrage_nom);
    
        const payload = {
            id: parseInt(id, 10), // pass the id for upsert
            reference_enedis: v.reference_enedis?.trim() ?? '',
            adresse_enedis: v.adresse_enedis?.trim() ?? '',
            maitre_ouvrage_nom: v.maitre_ouvrage_nom ?? '',
            maitre_ouvrage_tel: mo?.telephone ?? '',
            maitre_ouvrage_mail: mo?.email ?? '',
            syndic_nom: v.syndic_nom ?? '',
            syndic_adresse: v.syndic_adresse ?? '',
            syndic_interlocteur: v.syndic_interlocteur ?? '',
            syndic_tel: v.syndic_tel ?? '',
            syndic_mail: v.syndic_email ?? '',
            tiers_mandate_adresse: v.tiers_mandate_adresse ?? '',
            tiers_mandate_interlocuteur: v.tiers_mandate_interlocuteur ?? '',
            tiers_mandate_mail: v.tiers_mandate_mail ?? '',
            tiers_mandate_nom: v.tiers_mandate_nom ?? '',
            tiers_mandate_tel: v.tiers_mandate_tel ?? '',
        };
        try {
            await generalUpdate("/api/contacts", payload);
        } catch (e) {
            console.error('Save failed', e);
            return false;
        } 
        return true;
    };

    const mergedInitials = useMemo(() => {
        const newData = {
          reference_enedis: 'ENEDIS REA - DR EST',
          adresse_enedis: '12 rue du Centre 93160 Noisy-le-Grand',
          maitre_ouvrage_nom: '',
          maitre_ouvrage_tel: '',
          maitre_ouvrage_mail:'',
          syndic_nom: '',
          syndic_adresse: '',
          syndic_interlocteur: '',
          syndic_tel: '',
          syndic_mail: '',
          tiers_mandate_nom: '',
          tiers_mandate_adresse: '',
          tiers_mandate_interlocuteur: '',
          tiers_mandate_tel: '',
          tiers_mandate_mail: '',
          ...initialValues, // écrase les défauts si présent
        };
        return newData; 
    }, [initialValues]);

    useEffect(() => {
        form.setFieldsValue(mergedInitials);
    }, [form, mergedInitials]);


    return (
        <div>
        <Form form={form} layout="vertical" requiredMark={true} initialValues={mergedInitials} >            
            
            <Divider orientation="left" plain>
                <span className="text-lg font-bold">Pôle ENEDIS</span>
            </Divider>

            <Form.Item name="reference_enedis" label="Référence">
                <Input placeholder="ENEDIS REA - DR EST" />
            </Form.Item>

            <Form.Item name="adresse_enedis" label="Adresse">
                <Input placeholder="ex: 19 rue de Enedis" />
            </Form.Item>

            <Form.Item label="Maître d'ouvrage" name="maitre_ouvrage_nom">
            <Select>
                <Select.Option value="Lucas CHAUVEAU">Lucas CHAUVEAU</Select.Option>
                <Select.Option value="Tiphaine WATELLE">Tiphaine WATELLE</Select.Option>
                <Select.Option value="Amira ABID">Amira ABID</Select.Option>
            </Select>
            </Form.Item>


            <div className="my-15"/>


            <Divider orientation="left" plain>
                <span className="text-lg font-bold">Syndic</span>
            </Divider>

            <Form.Item name="syndic_nom" label="Nom">
                <Input placeholder="ex: FONCIA" />
            </Form.Item>

            <Form.Item name="syndic_adresse" label="Adresse">
                <Input placeholder="ex: 19 rue de Syndic" />
            </Form.Item>

            <Form.Item name="syndic_interlocteur" label="Interlocuteur">
                <Input placeholder="ex: M. Dupont" />
            </Form.Item>

            <Form.Item name="syndic_tel" label="Téléphone">
                <Input placeholder="ex: 01 02 03 04 05" />
            </Form.Item>

            <Form.Item name="syndic_email" label="Email">
                <Input placeholder="ex:syndic@foncia.com" />
            </Form.Item>


            <div className="my-15"/>

            <Divider orientation="left" plain>
                <span className="text-lg font-bold">Tiers Mandaté</span>
            </Divider>

            <Form.Item name="tiers_mandate_nom" label="Nom">
                <Input placeholder="ex: TOR" />
            </Form.Item>

            <Form.Item name="tiers_mandate_adresse" label="Adresse">
                <Input placeholder="ex: 19 rue de Tiers Mandaté" />
            </Form.Item>

            <Form.Item name="tiers_mandate_interlocuteur" label="Interlocuteur">
                <Input placeholder="ex: M. Charles" />
            </Form.Item>

            <Form.Item name="tiers_mandate_tel" label="Téléphone">
                <Input placeholder="ex: 01 02 03 04 05" />
            </Form.Item>

            <Form.Item name="tiers_mandate_mail" label="Email">
                <Input placeholder="ex:tm@tor.com" />
            </Form.Item>

            <div className="flex align-center justify-start mt-10">
                <SaveButton onSave={onSave} />
            </div>
        </Form>
        </div>
    );
}

export default function ContactsPage() {
    const { id } = useParams();

    // Retrieve initial values for the form, e.g. from an API
    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const data = await generalFetch("/api/contacts", id);
            setInitialValues(data);
        }
        fetchData();
    }, [id]);

    return (
        <div className="p-12">
            <div className="flex justify-center mb-8">
            <TypingAnimation className="text-3xl font-bold text-center">Contacts</TypingAnimation>
            </div>
            <FormContacts id={id} initialValues={initialValues}/>

        </div>
    )
}


import React, { useState, useEffect } from 'react';
import { RetroGrid } from "../../components/ui/retro-grid";
import { TableTemplate } from "../../components/general/table";
import { Space, Popconfirm, Button, Popover, Drawer, Form, Input } from 'antd';
import { PlusOutlined } from "@ant-design/icons";


// Columns for tables 

function getColumns(label, onAction) {
    const isEnCours = label === "en-cours";

    return [
        {
        title: 'Référence',
        dataIndex: 'reference',
        key: 'reference'
        },
        {
        title: 'Adresse',
        dataIndex: 'adresse',
        key: 'adresse'
        },
        {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
            {isEnCours ? (
                <Popconfirm
                title="Supprimer cette étude ?"
                description="Attention : Cette action est irréversible. Toutes les données et images seront définitivement supprimées."
                onConfirm={() => onAction(record, "archives")}
                okText="Supprimer"
                cancelText="Annuler"
                okButtonProps={{ danger: true }}
                >
                <Button type="primary" danger>Supprimer</Button>
                </Popconfirm>
            ) : (
                <Popconfirm
                title="Restaurer cette étude ?"
                onConfirm={() => onAction(record, "en-cours")}
                >
                <Button type="primary">Restaurer</Button>
                </Popconfirm>
            )}
            {isEnCours && (
                <Button type="primary" onClick={() => onAction(record, "modifier")}>
                Modifier
                </Button>
            )}
            </Space>
        ),
        },
  ];
}


export function Accueil() {
    return (
        <div className="flex flex-col gap-6 h-full w-fill items-center justify-center py-20">  
            <RetroGrid/>      
            <span className="pointer-events-none z-10 whitespace-pre-wrap bg-clip-text text-center text-6xl font-bold leading-none tracking-tighter">
                Bienvenue 👋🏻
            </span>   
            <p className="text-lg">dans votre application pour créer efficacement vos études ENEDIS</p>      
            <img className="pt-20" src="/plan-enedis.jpg" alt="Illustration" width={400} height={400} />

        </div>
    );
}

export function EnCours({ data, onAction }) {
    const columns = React.useMemo(() => getColumns("en-cours", onAction), [onAction]);

    return (
        <div className="flex flex-col gap-6 h-full w-full items-center justify-center py-10">  
            <span className="pointer-events-none z-10 whitespace-pre-wrap bg-clip-text text-4xl font-bold leading-none tracking-tighter">
                Etudes en Cours
            </span>
            <div className="pt-15 px-10 w-full">
                <TableTemplate columns={columns} data={data} />
            </div>
        </div>
    )
}

export function Archives({ data, onAction }) { 
    const columns = React.useMemo(() => getColumns("archives", onAction), [onAction]); 
    return (
        <div className="flex flex-col gap-6 h-full w-full items-center justify-center py-10">  
            <span className="pointer-events-none z-10 whitespace-pre-wrap bg-clip-text text-4xl font-bold leading-none tracking-tighter">
                Etudes Archivées
            </span>
            <div className="pt-15 px-10 w-full">
                <TableTemplate columns={columns} data={data} />
            </div>
        </div>
    )
}


export function DrawerNew({ onAction }) {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
  
    const showDrawer = () => setOpen(true);
    const onClose = () => setOpen(false);
  
    const onSave = async () => {
      try {
        const values = await form.validateFields();   // validate first
        setSubmitting(true);
        await onAction?.(values);                      // call parent (e.g., API)
        form.resetFields();
        setOpen(false);                                // then close
      } catch (err) {
        // validation failed or onAction threw
      } finally {
        setSubmitting(false);
      }
    };
  
    return (
      <>
        <Popover content="Créer une nouvelle étude">
          <Button
            type="primary"
            onClick={showDrawer}
            icon={<PlusOutlined />}
            className="!bg-[var(--color-secondary)] !text-[var(--color-black)] !border-0 hover:!bg-[var(--color-secondary)]"
          >
            Nouveau
          </Button>
        </Popover>
  
        <Drawer
          title="Créer une nouvelle étude"
          width={560}
          onClose={onClose}
          open={open}
          extra={
            <Space>
              <Button onClick={onClose}>Annuler</Button>
              <Button type="primary" onClick={onSave} loading={submitting}>
                Sauvegarder
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
              name="reference"
              label="Référence"
              rules={[{ required: true, message: 'Veuillez entrer la référence' }]}
            >
              <Input placeholder="ex: Proj-001" />
            </Form.Item>
  
            <Form.Item name="adresse" label="Adresse">
              <Input placeholder="10 rue de la Paix, Paris" />
            </Form.Item>
          </Form>
        </Drawer>
      </>
    );
  }
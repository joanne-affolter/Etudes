'use client';

import { useState } from 'react';
import { Popconfirm, Button, notification } from 'antd';

export function SaveButton({ onSave }) {
    const [api, contextHolder] = notification.useNotification();
    const [saving, setSaving] = useState(false);
  
    const handleConfirm = async () => {
      try {
        setSaving(true);
        const ok = await onSave();          // return true on success, false/throw on failure
        if (ok) {
          api.success({
            message: 'Sauvegarde réussie',
            description: 'Les informations ont été enregistrées.',
            placement: 'topRight',
          });
        } else {
          api.error({
            message: 'Échec de la sauvegarde',
            description: 'Veuillez réessayer ou vérifier les champs requis.',
            placement: 'topRight',
          });
        }
      } catch (e) {
        api.error({
          message: 'Erreur',
          description: e?.message || 'Une erreur est survenue pendant la sauvegarde.',
          placement: 'topRight',
        });
      } finally {
        setSaving(false);
      }
    };
  
    return (
      <>
        {contextHolder}
        <Popconfirm
          title="Sauvegarder les informations ?"
          onConfirm={handleConfirm}
          okText="Oui"
          cancelText="Annuler"
          okButtonProps={{ loading: saving }}
        >
          <Button type="primary" loading={saving}>
            Sauvegarder
          </Button>
        </Popconfirm>
      </>
    );
  }
'use client';

import { useState } from 'react';
import { Popconfirm, Button, notification } from 'antd';

export function SaveButton({ onSave, label = 'Sauvegarder' }) {
    const [api, contextHolder] = notification.useNotification();
    const [saving, setSaving] = useState(false);
  
    const handleConfirm = async () => {
      try {
        setSaving(true);
        const ok = await onSave();          // return true on success, false/throw on failure
        if (ok) {
          api.success({
            message: label === 'Compresser' ? 'Compression réussie' : 'Sauvegarde réussie',
            description: label === 'Compresser' 
              ? 'Les images ont été compressées avec succès.' 
              : 'Les informations ont été enregistrées.',
            placement: 'topRight',
          });
        } else {
          api.error({
            message: label === 'Compresser' ? 'Échec de la compression' : 'Échec de la sauvegarde',
            description: 'Veuillez réessayer ou vérifier les champs requis.',
            placement: 'topRight',
          });
        }
      } catch (e) {
        api.error({
          message: 'Erreur',
          description: e?.message || `Une erreur est survenue pendant ${label === 'Compresser' ? 'la compression' : 'la sauvegarde'}.`,
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
          title={label === 'Compresser' ? 'Compresser toutes les images ?' : 'Sauvegarder les informations ?'}
          description={label === 'Compresser' ? 'Cela va réduire la taille de toutes les images affichées.' : undefined}
          onConfirm={handleConfirm}
          okText="Oui"
          cancelText="Annuler"
          okButtonProps={{ loading: saving }}
        >
          <Button type="primary" loading={saving}>
            {label}
          </Button>
        </Popconfirm>
      </>
    );
  }
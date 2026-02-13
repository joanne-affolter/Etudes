"use client";
import dynamic from "next/dynamic";

import { useParams } from 'next/navigation';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button, Spin, Upload, Modal, Collapse, Divider, Input, message } from "antd";
import { TypingAnimation } from "../../../../components/ui/typing-animation";
import { SaveButton } from "../../../../components/general/saveButton";
import { UploadOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { generalFetch, generalUpdate } from '../../data';

import { DndContext, PointerSensor, useSensor } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


//BLOB
import { upload } from '@vercel/blob/client';


const { TextArea } = Input;

// Image compression - Optimisé pour réduire la taille
// maxWidth réduit à 800px, quality à 0.4 (40%) pour minimiser le payload Carbone.io
async function compressImage(file, maxWidth = 800, quality = 0.4) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = (height / width) * maxWidth;
            width = maxWidth;
          } else {
            width = (width / height) * maxWidth;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Amélioration du rendu pour de meilleures compressions
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`[Compression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB (${((1 - blob.size / file.size) * 100).toFixed(0)}% réduction)`);
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Filename hashing
function toHex(uint8) {
  return Array.from(uint8, b => b.toString(16).padStart(2, '0')).join('');
}


export async function uniqueFilenameFromFile(file) {
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop().toLowerCase()}` : '';
  const encoder = new TextEncoder();

  // Deterministic inputs
  const info = `${file.name}-${file.size}-${file.lastModified}`;

  // Random salt (avoids collisions, but generated only at upload time)
  const salt = crypto.getRandomValues(new Uint8Array(4));

  const data = encoder.encode(info);
  const combined = new Uint8Array(data.length + salt.length);
  combined.set(data, 0);
  combined.set(salt, data.length);

  const digest = await crypto.subtle.digest('SHA-256', combined);
  const hex = toHex(new Uint8Array(digest)).slice(0, 24);

  return `${hex}${ext}`;
}

/* ---------------- Draggable list item ---------------- */
const DraggableUploadListItem = ({ originNode, file }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: file.uid });

  const style = { transform: CSS.Translate.toString(transform), transition, cursor: 'move' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'is-dragging' : ''}
      {...attributes}
      {...listeners}
    >
      {file.status === 'error' && isDragging ? originNode.props.children : originNode}
    </div>
  );
};

/* ---------------- Preview ---------------- */
function PreviewModal({ open, src, title, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      footer={null}
      onCancel={onClose}
      width={800}
    >
      {src ? (
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <Image alt="preview" src={src} fill className="object-contain" />
        </div>
      ) : null}
    </Modal>
  );
}

/* ---------------- Upload + DnD  ---------------- */
export const ImageHandler = dynamic(() => Promise.resolve(InnerImageHandler), { ssr: false });


const InnerImageHandler = forwardRef(function ImageHandler({ initialFiles = [] }, ref) {
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState([]);

  const [preview, setPreview] = useState({ open: false, src: '', title: '' });

  useEffect(() => {
    if (initialFiles?.length) setFileList(initialFiles);
  }, [initialFiles]);

  useImperativeHandle(ref, () => ({
    getOrderedFiles: () => [...fileList],
    updateFileUrl: (oldUrl, newUrl, newPathname) => {
      setFileList(prev => prev.map(f =>
        f.url === oldUrl
          ? { ...f, url: newUrl, pathname: newPathname, uid: newUrl }
          : f
      ));
    },
  }));

  const sensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setFileList(prev => {
      const from = prev.findIndex(i => i.uid === active.id);
      const to = prev.findIndex(i => i.uid === over.id);
      if (from < 0 || to < 0) return prev;

      const next = arrayMove(prev, from, to);

      return next;
    });
  };

  // keep order from `prev`, merge props from `next`, append new items at the end
  const reconcileFileList = (prev, next) => {
    const nextByUid = new Map(next.map(n => [n.uid, n]));

    // 1) keep previous order for existing items, merging fields (so we don't lose url/pathname)
    const kept = prev
      .map(p => (nextByUid.has(p.uid) ? { ...p, ...nextByUid.get(p.uid), url: p.url ?? nextByUid.get(p.uid).url, pathname: p.pathname ?? nextByUid.get(p.uid).pathname } : null))
      .filter(Boolean);

    // 2) append any brand new items (those not in prev)
    const added = next.filter(n => !prev.some(p => p.uid === n.uid));

    return [...kept, ...added];
  };

  const onChange = ({ file, fileList: next }) => {
    setFileList(prev => reconcileFileList(prev, next));
  };

  const onRemove = async (file) => {
    try {
      // Skip API delete for non-Blob demo images
      if (!file.url || !/\.public\.blob\.vercel-storage\.com/.test(file.url)) {
        return true;
      }

      // Prefer saved pathname; derive from url if needed
      const pathname = file.pathname || new URL(file.url).pathname.replace(/^\/+/, '');

      console.log('[blob-delete] Suppression demandée:', { pathname, url: file.url });

      const res = await fetch('/api/blob-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname, url: file.url }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Delete failed');

      console.log('[blob-delete] ✓ Blob supprimé avec succès:', pathname);
      queueMicrotask(() => messageApi.success('Image supprimée'));
      return true;
    } catch (err) {
      console.error('[blob-delete] ✗ Erreur de suppression:', { pathname: file.pathname, error: err.message });
      queueMicrotask(() => messageApi.error('Suppression impossible'));
      return false;
    }
  };

  const toDataUrl = file =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handlePreview = async file => {
    let src = file.url || file.preview || file.thumbUrl;
    if (!src && file.originFileObj) {
      src = await toDataUrl(file.originFileObj);
      file.preview = src;
    }
    setPreview({ open: true, src: src || '', title: file.name || 'Aperçu' });
  };

  // Uploading 
  const customRequest = async ({ file, onSuccess, onError }) => {

    try {
      // mark as uploading (UI feedback)
      setFileList(prev =>
        prev.map(f => (f.uid === file.uid ? { ...f, status: 'uploading', percent: 0 } : f))
      );

      // Compresser l'image avant l'upload
      const compressedFile = await compressImage(file);
      const safeName = await uniqueFilenameFromFile(compressedFile);

      // upload directly from the browser to Blob
      const newBlob = await upload(safeName, compressedFile, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
      });

      // update this file item with the public Blob URL
      setFileList(prev =>
        prev.map(f =>
          f.uid === file.uid
            ? {
              ...f,
              url: newBlob.url,
              pathname: newBlob.pathname,
              status: 'done',
              percent: 100,
              name: safeName,
              originFileObj: undefined,
            }
            : f
        )
      );

      messageApi.success('Image uploaded');
      onSuccess?.(newBlob, file);
    } catch (err) {
      console.error('Upload error:', err);
      setFileList(prev =>
        prev.map(f => (f.uid === file.uid ? { ...f, status: 'error' } : f))
      );
      const msg =
        err?.message?.includes('No token') ? 'Configuration error (Blob token missing).' :
          err?.message?.includes('content type') ? 'Type de fichier non autorisé.' :
            'Échec de l’upload. Merci de réessayer.';
      messageApi.error(msg);
      onError?.(err);
    }
  };


  return (
    <>
      {contextHolder}
      <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
        <SortableContext items={fileList.map(i => i.uid)} strategy={verticalListSortingStrategy}>
          <Upload
            fileList={fileList}
            listType="picture"
            multiple
            accept="image/*"
            onChange={onChange}
            onRemove={onRemove}
            onPreview={handlePreview}
            showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
            itemRender={(originNode, file) => (
              <DraggableUploadListItem key={file.uid} originNode={originNode} file={file} />
            )}
            customRequest={customRequest}
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </SortableContext>
      </DndContext>
      <PreviewModal
        open={preview.open}
        src={preview.src}
        title={preview.title}
        onClose={() => setPreview({ open: false, src: '', title: '' })}
      />
    </>
  );
});

const ImagePanel = React.forwardRef(function ImagePanel({
  sectionName,
  parkingIdx,
  initialDescription = '',
  initialUrls = [],
}, ref) {
  const handlerRef = useRef(null);  // points to ImageHandler
  const [description, setDescription] = useState(initialDescription);

  const initialFiles = React.useMemo(
    () => initialUrls.map((u, i) => toUploadItem(u, i)),
    [initialUrls]
  );
  useImperativeHandle(ref, () => ({
    getPayload: () => {
      const files = handlerRef.current?.getOrderedFiles?.() || "";
      const fileUrlsInit = files
        .filter(f => !!f.url)
        .map(f => f.url); // order preserved
      const fileUrls = fileUrlsInit.join(', '); // if you want to store as comma-separated string
      return {
        title: sectionName,
        parking_idx: parkingIdx,
        description,
        fileUrls,
      };
    },
    updateFileUrl: (oldUrl, newUrl, newPathname) => {
      handlerRef.current?.updateFileUrl?.(oldUrl, newUrl, newPathname);
    },
  }));

  return (
    <div className="px-6">
      <Divider orientation="left" plain>
        <span className="text-lg font-bold">{sectionName}</span>
      </Divider>

      <div className="mb-8">
        <TextArea
          rows={2}
          value={description}
          onChange={e =>
            setDescription(e.target.value)
          }
          placeholder="Ex. Départ poste extérieur au bâtiment…"
        />
      </div>

      <ImageHandler ref={handlerRef} initialFiles={initialFiles} />
      <div className="my-20" />
    </div>
  );
});


// Parse DB string to array (prefers JSON string, falls back to comma split)
const parseUrls = (s) => {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : String(s).split(',').map(x => x.trim()).filter(Boolean);
  } catch {
    return String(s).split(',').map(x => x.trim()).filter(Boolean);
  }
};

// Build an AntD Upload item for a Blob URL
const toUploadItem = (url, i = 0) => {
  const pathname = new URL(url).pathname.replace(/^\/+/, '');
  const name = decodeURIComponent(pathname.split('/').pop() || `file-${i + 1}`);
  // uid must be stable for DnD; here we use url
  return {
    uid: `${url}`,        // stable
    name,
    status: 'done',
    url,
    pathname,
    percent: 100,
  };
};

/* ---------------- Page ---------------- */
export default function ImagesAvantPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [pd, setPd] = useState([]);
  const [presets, setPresets] = useState({}); // { [key]: { description, urls[] } }

  // Map of refs keyed by a stable key
  const panelRefs = useRef({});

  const registerPanelRef = (key) => (el) => {
    panelRefs.current[key] = el;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const gen = await generalFetch('/api/infos-generales', id);
      const parkingDetails = Array.isArray(gen?.parking_details) ? gen.parking_details : [];
      setPd(parkingDetails);

      // fetch saved uploads for this project/section
      const r = await fetch(`/api/images?projectId=${Number(id)}&section=apres`);
      const t = await r.text();
      if (!r.ok) throw new Error(t);
      const { items = [] } = JSON.parse(t);

      // Build a quick lookup { "title|idx": { description, urls[] } }
      const map = {};
      for (const row of items) {
        const key = `${row.title}|${row.parking_idx}`;
        map[key] = {
          description: row.description || '',
          urls: parseUrls(row.fileUrls), // string in DB → array
        };
      }
      setPresets(map);
    })().finally(() => setLoading(false));
  }, [id]);

  // Build panels: one "Infos générales" (parking_idx=0), then per parking
  const generalTitles = ["Plan Réseau", "Plan Travaux", "Colonne de Terre"];

  const items = [
    {
      key: 'info',
      label: <span className="text-lg font-bold">Infos générales</span>,
      forceRender: true,
      children: (
        <div className="space-y-8">
          {generalTitles.map((title, idx) => {
            const key = `${title}|0`;
            const preset = presets[key] || { description: '', urls: [] };
            return (
              <ImagePanel
                key={`info-${idx}`}
                ref={registerPanelRef(`info-${idx}`)}
                sectionName={title}
                parkingIdx={0}
                initialDescription={preset.description}
                initialUrls={preset.urls}
              />
            );
          })}
        </div>
      ),
    },
    ...pd.map((p, index) => ({
      key: `p-${index + 1}`,
      label: (
        <span className="text-lg font-bold">
          Parking {index + 1} — {p.interieur ? 'Intérieur' : 'Extérieur'}
        </span>
      ),
      forceRender: true,
      children: (
        <div className="space-y-8">
          {[
            "Arrivée Réseau",
            "Local TGBT",
            "Synoptique",
            ...Array.from(
              { length: p.travees },
              (_, i) => `Travée ${i + 1}`
            ),
            ...Array.from(
              { length: p.nb_departs },
              (_, i) => `Calcul colonne électrique Départ ${i + 1}`
            ),
          ].map((title, idx2) => {
            const pk = index + 1;
            const key = `${title}|${pk}`;
            const preset = presets[key] || { description: '', urls: [] };
            return (
              <ImagePanel
                key={`p-${pk}-${idx2}`}
                ref={registerPanelRef(`p-${pk}-${idx2}`)}
                sectionName={title}
                parkingIdx={pk}
                initialDescription={preset.description}
                initialUrls={preset.urls}
              />
            );
          })}
        </div>
      ),
    })),
  ];

  // Fonction pour télécharger et recompresser une image blob
  const recompressBlobImage = async (url, pathname) => {
    try {
      // Télécharger l'image depuis le blob
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const file = new File([blob], pathname.split('/').pop() || 'image.jpg', {
        type: blob.type || 'image/jpeg',
      });

      console.log(`[Recompression] Début pour ${pathname}`);

      // Compresser l'image
      const compressedFile = await compressImage(file);
      const safeName = await uniqueFilenameFromFile(compressedFile);

      // Upload la version compressée
      const newBlob = await upload(safeName, compressedFile, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
      });

      // Supprimer l'ancienne version
      await fetch('/api/blob-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname, url }),
      });

      console.log(`[Recompression] ✓ ${pathname} → ${newBlob.pathname}`);
      return newBlob.url;
    } catch (err) {
      console.error(`[Recompression] Erreur pour ${pathname}:`, err);
      return url; // Garder l'URL originale en cas d'erreur
    }
  };

  const onCompress = async () => {
    try {
      const refs = panelRefs.current;
      const panels = Object.keys(refs).map(k => refs[k]).filter(Boolean);

      let totalImages = 0;
      let compressedImages = 0;

      console.log('[Compress] Début de la recompression...');

      for (let panel of panels) {
        const payload = panel.getPayload?.();
        if (!payload?.fileUrls) continue;

        const urls = payload.fileUrls.split(',').map(u => u.trim()).filter(Boolean);

        for (let url of urls) {
          if (url.includes('.public.blob.vercel-storage.com')) {
            totalImages++;
            const pathname = new URL(url).pathname.replace(/^\/+/, '');
            const newUrl = await recompressBlobImage(url, pathname);

            if (newUrl !== url) {
              compressedImages++;
              const newPathname = new URL(newUrl).pathname.replace(/^\/+/, '');
              panel.updateFileUrl?.(url, newUrl, newPathname);
            }
          }
        }
      }

      console.log(`[Compress] Terminé: ${compressedImages}/${totalImages} images compressées`);

      // Sauvegarder automatiquement en DB après la compression
      if (compressedImages > 0) {
        console.log('[Compress] Sauvegarde en DB des nouvelles URLs...');
        const saveResult = await onSave();
        if (!saveResult) {
          throw new Error('Échec de la sauvegarde en DB');
        }
        console.log('[Compress] ✓ Sauvegarde en DB réussie');
      }

      return true;
    } catch (e) {
      console.error('[Compress] Erreur:', e);
      return false;
    }
  };

  const onSave = async () => {
    try {
      const refs = panelRefs.current;
      const entries = Object.keys(refs)
        .map(k => refs[k]?.getPayload?.())
        .filter(Boolean);

      // Attach the global "section" 
      const body = {
        projectId: Number(id),
        section: 'apres',
        entries, // [{ title, parking_idx, description, fileUrls }]
      };

      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');
      return true;

    } catch (e) {
      console.log('Échec de la sauvegarde');
      return false;
    }
  };

  return (
    <div className="p-12">
      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <TypingAnimation className="text-3xl font-bold text-center">
              Images Après
            </TypingAnimation>
          </div>

          <Collapse
            items={items}
            defaultActiveKey={items.length ? [items[0].key] : []}
            destroyOnHidden={false}
          />

          <div className="flex align-center justify-start mt-10 gap-4">
            <SaveButton onSave={onCompress} label="Compresser" />
            <SaveButton onSave={onSave} />
          </div>
        </>
      )}
    </div>
  );
}
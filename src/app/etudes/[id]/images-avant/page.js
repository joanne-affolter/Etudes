"use client";
import { useParams } from 'next/navigation';
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button, Spin, Upload, Modal, Collapse, Divider, Input } from "antd";
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

const { TextArea } = Input;

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
        {src ? <Image alt="preview" src={src} style={{ width: '100%' }} /> : null}
      </Modal>
    );
  }

/* ---------------- Upload + DnD  ---------------- */
const ImageHandler = forwardRef(function ImageHandler(_, ref) {
    const [fileList, setFileList] = useState([
      {
        uid: '-1',
        name: 'xxx.png',
        status: 'done',
        url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
        thumbUrl:
          'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      },
    ]);
  
    const [preview, setPreview] = useState({ open: false, src: '', title: '' });
  
    useImperativeHandle(ref, () => ({
      getOrderedFiles: () => [...fileList],
    }));
  
    const sensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } });
  
    const onDragEnd = ({ active, over }) => {
      if (active.id !== over?.id) {
        setFileList(prev => {
          const from = prev.findIndex(i => i.uid === active.id);
          const to = prev.findIndex(i => i.uid === over?.id);
          return arrayMove(prev, from, to);
        });
      }
    };
  
    // local only; no auto-upload
    const beforeUpload = () => false;
    const onChange = ({ fileList: newList }) => setFileList(newList);
    const onRemove = async () => {};
  
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
  
    return (
      <>
        <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
          <SortableContext items={fileList.map(i => i.uid)} strategy={verticalListSortingStrategy}>
            <Upload
              fileList={fileList}
              listType="picture"
              beforeUpload={beforeUpload}
              multiple
              accept="image/*"
              onChange={onChange}
              onRemove={onRemove}
              onPreview={handlePreview}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              itemRender={(originNode, file) => (
                <DraggableUploadListItem originNode={originNode} file={file} />
              )}
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


function ImagePanel({ sectionName, parkingIdx}) {
    const childRef = useRef(null);
    const [description, setDescription] = useState('');

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


        
        <ImageHandler ref={childRef} />
        <div className="my-20"/>
    </div>
    );
}


function ParkingPanel({ pIndex }) {
    const titles = ["Arrivée Réseau", "Local TGBT", "Parking"]
    
    return (
        <div className="space-y-8">
            {titles.map((title, idx) => (
                <ImagePanel 
                    key={idx}
                    sectionName={title}
                    parkingIdx={pIndex}
                />
            ))}
        </div>
    );
}

function InfosGeneralesPanel() {
    const titles = ["Plan Réseau", "Accès Copro", "Accès Parking"]
    return (
        <div className="space-y-8">
            {titles.map((title, idx) => (
                <ImagePanel 
                    key={idx}
                    sectionName={title}
                    parkingIdx={0} // No parking index for general images
                />
            ))}
        </div>
    );
}
  

/* ---------------- Page ---------------- */
export default function ImagesAvantPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [pd, setPd] = useState([]); // parking details from infos-generales
  
  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) Data from infos-generales
      const gen = await generalFetch('/api/infos-generales', id);
      const parkingDetails = Array.isArray(gen?.parking_details) ? gen.parking_details : [];
      setPd(parkingDetails);
    })()
    .finally(() => setLoading(false));
  }, [id]);

  const items = [
    {
      key: 'info',
      label: <span className="text-lg font-bold">Infos générales</span>,
      forceRender: true,
      children: <InfosGeneralesPanel />,
    },
    ... pd.map((p, index) => ({
    key: index,
    label: <span className="text-lg font-bold">Parking {index + 1} — {p.interieur ? 'Intérieur' : 'Extérieur'}</span>,
    forceRender: true,
    children: (
      <ParkingPanel
        pIndex={index+1}
      />
    ),
  }))
    ];


  const onSave = async () => {
    const ordered = childRef.current?.getOrderedFiles() || [];

    // Example: build payload preserving order (0..n−1)
    const formData = new FormData();
    formData.append('projectId', String(id));

    ordered.forEach((file, index) => {
      // If it’s a new local file, send the binary
      if (file.originFileObj) {
        formData.append('files', file.originFileObj, file.name);
      } else if (file.url) {
        // Already on server — send reference so backend can just reorder
        formData.append('existingUrls[]', file.url);
      }
      // Always send the order metadata
      formData.append('order[]', String(index));     // visual order
      formData.append('uids[]', file.uid);          // stable client id
      formData.append('names[]', file.name || '');  // optional
    });

    // Example call — change to your API
    // await fetch('/api/images/upload-or-reorder', { method: 'POST', body: formData });

    console.log('Ordered files for save:', ordered.map((f, i) => ({
      i,
      uid: f.uid,
      name: f.name,
      hasBinary: !!f.originFileObj,
      url: f.url,
    })));
  };

  return (
    <div className="p-12">
      

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : (
        <>
        <div className="flex justify-center mb-8">
        <TypingAnimation className="text-3xl font-bold text-center">
          Images Avant
        </TypingAnimation>
        </div>

        <Collapse
            items={items}
            defaultActiveKey={items.length ? [items[0].key] : []}
            destroyOnHidden={false}
        />

        <div className="flex align-center justify-start mt-10">
            <SaveButton onSave={onSave} />
        </div>

        </>
      )}
    </div>
  );
}

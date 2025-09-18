"use client";
import { useParams } from 'next/navigation';
import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button, Spin, Upload, Modal } from "antd";
import { TypingAnimation } from "../../../../components/ui/typing-animation";
import { SaveButton } from "../../../../components/general/saveButton";
import { UploadOutlined } from '@ant-design/icons';
import Image from 'next/image';

import { DndContext, PointerSensor, useSensor } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  

/* ---------------- Page ---------------- */
export default function ImagesApresPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const childRef = useRef(null);

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
      <div className="flex justify-center mb-8">
        <TypingAnimation className="text-3xl font-bold text-center">
          Images Avant
        </TypingAnimation>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" tip="Chargement des données..." />
        </div>
      ) : (
        <>
          <ImageHandler ref={childRef} />
          <div className="flex align-center justify-start mt-10">
            <SaveButton onSave={onSave} />
          </div>
        </>
      )}
    </div>
  );
}

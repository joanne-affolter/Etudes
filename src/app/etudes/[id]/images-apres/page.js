"use client";
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from "react";
import { Form, Checkbox, Button, Spin, message, Divider } from "antd";
import { TypingAnimation  } from "../../../../components/ui/typing-animation";
import { SaveButton } from "../../../../components/general/saveButton";




export default function ImagesApresPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
  return (
    <div className="p-12">
      <div className="flex justify-center mb-8">
        <TypingAnimation className="text-3xl font-bold text-center">Images Avant</TypingAnimation>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
            <Spin size="large" tip="Chargement des données..." />
        </div>
    ) : (
      <>
        

          <div className="flex align-center justify-start mt-10">
            <SaveButton onSave={onSave} />     
          </div>
      
        </>
      )}
    </div>
  );
}
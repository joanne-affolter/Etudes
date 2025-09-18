import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json(); 
    try {
        const result = await handleUpload({
          body,       // <-- pass body
          request,    // <-- and request
    
          onBeforeGenerateToken: async (pathname, clientPayload) => {
            // clientPayload can be a string or object depending on your client
            const payload =
              typeof clientPayload === 'string'
                ? JSON.parse(clientPayload || '{}')
                : (clientPayload || {});
    
            return {
              allowedContentTypes: ['image/*'],
              addRandomSuffix: true,
              tokenPayload: payload, // sent back in onUploadCompleted
            };
          },
    
          onUploadCompleted: async ({ blob, tokenPayload }) => {
            console.log('Upload complete:', blob.url, tokenPayload);
            // Persist to DB here if you want
          },
        });
    
        return NextResponse.json(result);
      } catch (e) {
        console.error('handleUpload error:', e);
        return NextResponse.json({ error: String(e) }, { status: 400 });
      }
    }
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    console.log(`[delete-project] Starting deletion for project ${projectId}`);

    // 1. Récupérer toutes les images associées au projet
    const images = await prisma.imageUpload.findMany({
      where: { projectId },
      select: { fileUrls: true }
    });

    // 2. Supprimer tous les blobs Vercel
    const deletePromises = [];
    for (const image of images) {
      // fileUrls peut contenir plusieurs URLs séparées par des virgules
      const urls = image.fileUrls.split(',').filter(url => url.trim());
      for (const url of urls) {
        try {
          const pathname = new URL(url.trim()).pathname.replace(/^\/+/, '');
          deletePromises.push(
            del(pathname).catch(err => {
              console.warn(`[delete-project] Failed to delete blob ${pathname}:`, err.message);
            })
          );
        } catch (e) {
          console.warn(`[delete-project] Invalid URL ${url}:`, e.message);
        }
      }
    }

    // Attendre que tous les blobs soient supprimés
    await Promise.all(deletePromises);
    console.log(`[delete-project] Deleted ${deletePromises.length} blob(s)`);

    // 3. Supprimer toutes les entrées de la base de données
    // L'ordre est important : supprimer les dépendances avant le projet
    
    await prisma.imageUpload.deleteMany({ where: { projectId } });
    console.log('[delete-project] Deleted ImageUpload entries');

    await prisma.infosGenerales.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted InfosGenerales');

    await prisma.contact.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted Contact');

    await prisma.prefinancement.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted Prefinancement');

    await prisma.material.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted Material');

    await prisma.materielInfoTechnique.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted MaterielInfoTechnique');

    await prisma.infosTechniquesMeta.deleteMany({ where: { id: projectId } });
    console.log('[delete-project] Deleted InfosTechniquesMeta');

    // 4. Supprimer le projet lui-même
    await prisma.project.delete({ where: { id: projectId } });
    console.log('[delete-project] Deleted Project');

    return NextResponse.json({ 
      ok: true, 
      message: `Project ${projectId} and all associated data deleted successfully`,
      blobsDeleted: deletePromises.length
    });

  } catch (err) {
    console.error('[delete-project] error:', err);
    return NextResponse.json({ 
      error: err?.message || 'Delete failed' 
    }, { status: 500 });
  }
}

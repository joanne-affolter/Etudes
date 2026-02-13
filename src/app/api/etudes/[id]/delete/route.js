import { NextResponse } from 'next/server';
import { prisma } from "../../../../../lib/prisma";

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }

        console.log(`[delete-project] Starting deletion for project ${projectId}`);

        // Construire l'URL de base pour les appels API internes
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        // 1. Récupérer toutes les images associées au projet
        const images = await prisma.imageUpload.findMany({
            where: { projectId },
            select: { fileUrls: true }
        });

        // 2. Supprimer tous les blobs Vercel via l'API blob-delete
        const deletePromises = [];
        for (const image of images) {
            // fileUrls peut contenir plusieurs URLs séparées par des virgules
            const urls = image.fileUrls.split(',').filter(url => url.trim());
            for (const url of urls) {
                try {
                    const trimmedUrl = url.trim();
                    const pathname = new URL(trimmedUrl).pathname.replace(/^\/+/, '');

                    deletePromises.push(
                        fetch(`${baseUrl}/api/blob-delete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: trimmedUrl, pathname })
                        })
                            .then(res => {
                                if (!res.ok) {
                                    console.warn(`[delete-project] Failed to delete blob ${pathname}`);
                                }
                                return res.json();
                            })
                            .catch(err => {
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
        // deleteMany ne lance pas d'erreur si aucune ligne n'est trouvée

        const deleteCounts = {
            imageUpload: await prisma.imageUpload.deleteMany({ where: { projectId } }),
            infosGenerales: await prisma.infosGenerales.deleteMany({ where: { id: projectId } }),
            contact: await prisma.contact.deleteMany({ where: { id: projectId } }),
            prefinancement: await prisma.prefinancement.deleteMany({ where: { id: projectId } }),
            material: await prisma.material.deleteMany({ where: { id: projectId } }),
            materielInfoTechnique: await prisma.materielInfoTechnique.deleteMany({ where: { id: projectId } }),
            infosTechniquesMeta: await prisma.infosTechniquesMeta.deleteMany({ where: { id: projectId } }),
        };

        console.log('[delete-project] Deleted records:', deleteCounts);

        // 4. Supprimer le projet lui-même
        await prisma.project.delete({ where: { id: projectId } });
        console.log('[delete-project] Deleted Project');

        return NextResponse.json({
            ok: true,
            message: `Project ${projectId} and all associated data deleted successfully`,
            blobsDeleted: deletePromises.length,
            recordsDeleted: {
                imageUpload: deleteCounts.imageUpload.count,
                infosGenerales: deleteCounts.infosGenerales.count,
                contact: deleteCounts.contact.count,
                prefinancement: deleteCounts.prefinancement.count,
                material: deleteCounts.material.count,
                materielInfoTechnique: deleteCounts.materielInfoTechnique.count,
                infosTechniquesMeta: deleteCounts.infosTechniquesMeta.count,
                project: 1
            }
        });

    } catch (err) {
        console.error('[delete-project] error:', err);
        return NextResponse.json({
            error: err?.message || 'Delete failed'
        }, { status: 500 });
    }
}

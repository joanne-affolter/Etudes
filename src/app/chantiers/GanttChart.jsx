'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Gantt from 'frappe-gantt';
import { Button, Space } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { updateChantier } from './data';

dayjs.extend(customParseFormat);

const TYPE_COLORS = {
  enedis:              '#1677ff',
  izi:                 '#52c41a',
  copros:              '#fa8c16',
  maison_individuelle: '#722ed1',
};

const TYPE_LABELS = {
  enedis:              'ENEDIS',
  izi:                 'IZI',
  copros:              'Copros',
  maison_individuelle: 'Maison individuelle',
};

const VIEW_MODES = [
  { key: 'Day',   label: 'Jour' },
  { key: 'Week',  label: 'Semaine' },
  { key: 'Month', label: 'Mois' },
];

function parseDate(str) {
  if (!str) return null;
  const d = dayjs(str, 'DD/MM/YYYY', true);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}

export function GanttChart({ chantiers, onRefresh }) {
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('Month');
  const [hoveredChantier, setHoveredChantier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({}); // { [id]: { id, debut, fin } }
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep callbacks in refs so they never cause effect re-runs
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const valid = useMemo(
    () => chantiers.filter(c => parseDate(c.debut) && parseDate(c.fin)),
    [chantiers]
  );

  const chantiersById = useMemo(
    () => Object.fromEntries(valid.map(c => [String(c.id), c])),
    [valid]
  );
  const chantiersByIdRef = useRef(chantiersById);
  useEffect(() => { chantiersByIdRef.current = chantiersById; }, [chantiersById]);

  const handleSaveDates = async () => {
    const changes = Object.values(pendingChanges);
    if (!changes.length) return;
    setSaving(true);
    try {
      await Promise.all(changes.map(c => updateChantier(c.id, { debut: c.debut, fin: c.fin })));
      setPendingChanges({});
      await onRefreshRef.current?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDates = () => {
    setPendingChanges({});
    setRefreshKey(k => k + 1);
  };

  // Inject CSS once
  useEffect(() => {
    const id = 'frappe-gantt-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = '/frappe-gantt.css';
    document.head.appendChild(link);
  }, []);

  // Rebuild Gantt when data or viewMode changes
  useEffect(() => {
    if (!containerRef.current || valid.length === 0) return;

    const tasks = valid.map(c => {
      return {
        id: String(c.id),
        name: c.adresse,
        start: parseDate(c.debut),
        end: parseDate(c.fin),
        progress: 0,
        custom_class: `type-${c.type}`,
      };
    });

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      new Gantt(containerRef.current, tasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        popup: false,
        on_date_change: (task, start, end) => {
          const fmt = d => [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            d.getFullYear(),
          ].join('/');
          const id = Number(task.id);
          setPendingChanges(prev => ({ ...prev, [id]: { id, debut: fmt(start), fin: fmt(end) } }));
        },
      });

      // Use data-id attribute — reliable regardless of render order
      const wrappers = containerRef.current?.querySelectorAll('.bar-wrapper');
      wrappers?.forEach(wrapper => {
        const taskId = wrapper.getAttribute('data-id');
        wrapper.addEventListener('mouseenter', () => {
          setHoveredChantier(chantiersByIdRef.current[taskId] ?? null);
        });
        wrapper.addEventListener('mouseleave', () => {
          setHoveredChantier(null);
        });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };

  }, [valid, viewMode, refreshKey]);

  if (valid.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Aucun chantier avec des dates de début et fin renseignées.
      </div>
    );
  }

  return (
    <div>
      {/* Legend + view switcher */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-sm">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[key] }} />
              {label}
            </div>
          ))}
        </div>
        <Space.Compact>
          {VIEW_MODES.map(({ key, label }) => (
            <Button key={key} type={viewMode === key ? 'primary' : 'default'} onClick={() => setViewMode(key)}>
              {label}
            </Button>
          ))}
        </Space.Compact>
      </div>

      <style>{`
        .gantt-container, .gantt-container * {
          font-family: 'Quicksand', sans-serif !important;
        }
        ${Object.entries(TYPE_COLORS).map(([type, color]) => `
          .type-${type} .bar { fill: ${color} !important; }
          .type-${type} .bar-progress { fill: ${color} !important; filter: brightness(0.85); }
        `).join('')}
        .gantt .bar-label { font-size: 11px; }
        .gantt .bar-label.big { fill: #333 !important; }
        .bar-wrapper { cursor: pointer; }
      `}</style>

      {/* Pending save banner */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="mb-3 flex items-start justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
          <div className="flex flex-col gap-1 text-orange-800">
            {Object.values(pendingChanges).map(change => {
              const c = chantiersByIdRef.current[String(change.id)];
              return (
                <span key={change.id}>
                  <b>{c?.adresse}</b> — <b>{change.debut}</b> → <b>{change.fin}</b>
                </span>
              );
            })}
            <span className="text-orange-600 mt-1">Voulez-vous sauvegarder ces modifications ?</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="small" onClick={handleCancelDates}>Annuler</Button>
            <Button size="small" type="primary" loading={saving} onClick={handleSaveDates}>Sauvegarder</Button>
          </div>
        </div>
      )}

      <div ref={containerRef} />

      {/* Hover info card */}
      <div
        style={{
          marginTop: 16,
          minHeight: 72,
          transition: 'opacity 0.15s',
          opacity: hoveredChantier ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {hoveredChantier && (
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex gap-6 flex-wrap text-sm">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Adresse</div>
              <div className="font-semibold">{hoveredChantier.adresse}</div>
              <div className="text-gray-500">{hoveredChantier.code_postal} {hoveredChantier.ville}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Type</div>
              <span
                className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: TYPE_COLORS[hoveredChantier.type] ?? '#999' }}
              >
                {TYPE_LABELS[hoveredChantier.type] ?? hoveredChantier.type}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Période</div>
              <div>{hoveredChantier.debut} → {hoveredChantier.fin}</div>
            </div>
            {hoveredChantier.telephone && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Téléphone</div>
                <div>{hoveredChantier.telephone}</div>
              </div>
            )}
            {hoveredChantier.numero_affaire && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">N° affaire</div>
                <div>{hoveredChantier.numero_affaire}</div>
              </div>
            )}
            {hoveredChantier.personnel?.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Personnel</div>
                <div>{hoveredChantier.personnel.map(p => `${p.prenom} ${p.nom}`).join(', ')}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

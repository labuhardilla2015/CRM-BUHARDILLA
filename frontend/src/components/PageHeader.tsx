export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

/** Placeholder para módulos aún no implementados (roadmap por fases). */
export function ComingSoon({ title, fase, desc }: { title: string; fase: string; desc: string }) {
  return (
    <div className="p-6 lg:p-8">
      <PageHeader title={title} subtitle={desc} />
      <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <div>
          <p className="text-sm font-medium text-slate-600">Módulo en construcción</p>
          <span className="mt-2 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            {fase}
          </span>
        </div>
      </div>
    </div>
  );
}

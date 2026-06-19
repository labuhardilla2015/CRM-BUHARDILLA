import { useQuery } from '@tanstack/react-query';
import { getLogoUrl } from '@/lib/clientes-api';
import { cn } from '@/lib/cn';

/** Muestra el logo del cliente (o su inicial si no tiene). */
export function ClienteLogo({
  id,
  nombre,
  logoRuta,
  className,
}: {
  id: string;
  nombre: string;
  logoRuta: string | null;
  className?: string;
}) {
  const logo = useQuery({
    queryKey: ['logo', id, !!logoRuta],
    queryFn: () => getLogoUrl(id),
    enabled: !!logoRuta,
    staleTime: 5 * 60_000,
  });

  return (
    <div className={cn('grid place-items-center overflow-hidden rounded-lg bg-brand/10', className)}>
      {logo.data ? (
        <img src={logo.data} alt={nombre} className="h-full w-full object-contain" />
      ) : (
        <span className="font-semibold text-brand">{nombre.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

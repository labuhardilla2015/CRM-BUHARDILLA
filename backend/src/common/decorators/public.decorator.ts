import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (omite el JwtAuthGuard global). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * tenants.service.ts — Lógica de negocio de tenants.
 * Sin acceso directo a BD. Usa el repository.
 */

import { tenantsRepository } from './tenants.repository';
import { NotFoundError, TenantSuspendedError } from '@/lib/errors';

export const tenantsService = {
  /** Verifica que el tenant existe y está activo */
  async verifyActive(slug: string) {
    const tenant = await tenantsRepository.findBySlug(slug);
    if (!tenant) throw new NotFoundError('Empresa');
    if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
      throw new TenantSuspendedError();
    }
    return tenant;
  },

  /** Información pública del tenant (para el login) */
  async getPublicInfo(slug: string) {
    const tenant = await tenantsRepository.findBySlug(slug);
    if (!tenant) throw new NotFoundError('Empresa');
    return {
      id:          tenant.id,
      slug:        tenant.slug,
      name:        tenant.name,
      logoUrl:     tenant.logoUrl,
      status:      tenant.status,
      themeConfig: tenant.themeConfig,
    };
  },
};

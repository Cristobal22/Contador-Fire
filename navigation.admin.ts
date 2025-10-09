
import type { NavStructure } from './types';

export const adminNavStructure: NavStructure = {
    'Dashboard': { icon: 'dashboard', path: '/dashboard', children: {} },
    'Administración': {
        icon: 'admin_panel_settings',
        children: {
            'Usuarios': { path: '/admin/users' },
        }
    },
    'Configuración': {
        icon: 'settings',
        children: {
            'General': { icon: 'tune', children: {
                'Empresas': { path: '/configuracion/general/empresas' },
                'Parámetros Mensuales': { path: '/configuracion/general/parametros-mensuales' }
            }}
        }
    },
};

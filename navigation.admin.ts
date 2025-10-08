
import type { NavStructure } from './types';

export const adminNavStructure: NavStructure = {
    'Dashboard': { icon: 'dashboard', path: '/dashboard', children: {} },
    'Configuración': {
        icon: 'settings',
        children: {
            'General': { icon: 'tune', children: {
                'Empresas': { path: '/configuracion/general/empresas' },
                'Usuarios': { path: '/configuracion/general/usuarios' },
                'Parámetros Mensuales': { path: '/configuracion/general/parametros-mensuales' }
            }}
        }
    },
};

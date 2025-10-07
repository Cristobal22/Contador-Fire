import type { NavStructure } from './types';

export const navStructure: NavStructure = {
    'Dashboard': { icon: 'dashboard', path: '/dashboard', children: {} },
    'Contabilidad': {
        icon: 'account_balance',
        children: {
            'Movimientos': { icon: 'receipt_long', children: {
                'Comprobantes': { path: '/contabilidad/movimientos/comprobantes' },
                'Compras': { path: '/contabilidad/movimientos/compras' },
                'Ventas': { path: '/contabilidad/movimientos/ventas' },
                'Honorarios': { path: '/contabilidad/movimientos/honorarios' },
                'Conciliación Bancaria': { path: '/contabilidad/movimientos/conciliacion-bancaria' }
            }},
            'Informes': { icon: 'assessment', children: {
                'Libro Diario': { path: '/contabilidad/informes/libro-diario' },
                'Libro Mayor': { path: '/contabilidad/informes/libro-mayor' },
                'Balances': { path: '/contabilidad/informes/balances' },
                'Balance General': { path: '/contabilidad/informes/balance-general' },
                'Resumen Mensual IVA': { path: '/contabilidad/informes/resumen-mensual-iva' }
            }},
            'Maestros': { icon: 'storage', children: {
                'Plan de Cuentas': { path: '/contabilidad/maestros/plan-de-cuentas' },
                'Grupos de Cuentas Contables': { path: '/contabilidad/maestros/grupos-de-cuentas' },
                'Sujetos': { path: '/contabilidad/maestros/sujetos' },
                'Centros de Costos': { path: '/contabilidad/maestros/centros-de-costos' }
            }}
        }
    },
    'Inventario y Costos': {
        icon: 'inventory_2',
        children: {
            'Gestión': { icon: 'settings_suggest', children: {
                'Items': { path: '/inventario-y-costos/gestion/items' },
                'Entradas a Bodega': { path: '/inventario-y-costos/gestion/entradas-a-bodega' },
                'Salidas de Bodega': { path: '/inventario-y-costos/gestion/salidas-de-bodega' }
            }},
            'Informes': { icon: 'summarize', children: {
                'Informe Items': { path: '/inventario-y-costos/informes/informe-items' }
            }}
        }
    },
    'Remuneraciones': {
        icon: 'groups',
        children: {
            'Movimientos': { icon: 'person_add', children: {
                'Ficha de Personal': { path: '/remuneraciones/movimientos/ficha-de-personal' },
                'Liquidaciones': { path: '/remuneraciones/movimientos/liquidaciones' }
            }},
            'Procesos': { icon: 'sync_alt', children: {
                'Importar Previred': { path: '/remuneraciones/procesos/importar-previred' }
            }},
            'Informes': { icon: 'description', children: {
                'Libro Remuneraciones': { path: '/remuneraciones/informes/libro-remuneraciones' },
                'Archivo Previred': { path: '/remuneraciones/informes/archivo-previred' },
                'Certificado Remuneraciones': { path: '/remuneraciones/informes/certificado-remuneraciones' }
            }},
            'Maestros': { icon: 'business_center', children: {
                'Instituciones': { path: '/remuneraciones/maestros/instituciones' },
                'Parámetros Asig. Familiar': { path: '/remuneraciones/maestros/parametros-asig-familiar' },
                'Parámetros IUT': { path: '/remuneraciones/maestros/parametros-iut' }
            }}
        }
    },
    'Procesos Críticos': {
        icon: 'sync',
        children: {
            'Centralización': { icon: 'hub', children: {
                'Centralización Remuneraciones': { path: '/procesos-criticos/centralizacion/centralizacion-remuneraciones' },
                'Centralización RCV (SII)': { path: '/procesos-criticos/centralizacion/centralizacion-rcv-sii' }
            }},
            'Cierres': { icon: 'lock_clock', children: {
                'Cierre Mensual': { path: '/procesos-criticos/cierres/cierre-mensual' }
            }}
        }
    },
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
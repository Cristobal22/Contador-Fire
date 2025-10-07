import type { Company, ChartOfAccount, Subject, Item, CostCenter, Employee, Institution, MonthlyParameter, Period, FamilyAllowanceBracket, IncomeTaxBracket, User, AccountGroup } from './types';

export const initialUsers: User[] = [
    // FIX: User ID is a string (UUID from Supabase), changed from number to string.
    { id: '1', name: 'Administrador del Sistema', email: 'admin@app.com', role: 'System Administrator', company_limit: 0, status: 'active' },
    // FIX: User ID is a string, changed from number to string.
    { id: '2', name: 'Juan Pérez Contador', email: 'contador@app.com', role: 'Accountant', company_limit: 3, status: 'active' },
    // FIX: User ID is a string, changed from number to string.
    { id: '3', name: 'Usuario Inactivo', email: 'inactive@app.com', role: 'Accountant', company_limit: 1, status: 'inactive' },
];

export const initialCompanies: Company[] = [
    // FIX: Company ownerId refers to a User ID, which is a string. Changed from number to string.
    // FIX: Corrected property name from `ownerId` to `owner_id` to match the `Company` type definition.
    { id: 1, rut: '76.123.456-7', name: 'Asesor25 SPA', address: 'Av. Siempre Viva 742', owner_id: '2' },
    // FIX: Company ownerId refers to a User ID, which is a string. Changed from number to string.
    // FIX: Corrected property name from `ownerId` to `owner_id` to match the `Company` type definition.
    { id: 2, rut: '77.890.123-K', name: 'Comercial del Sur Ltda.', address: 'Calle Falsa 123', owner_id: '2' },
];

export const initialAccountGroups: AccountGroup[] = [
    { id: 1, code: 'A', name: 'ACTIVOS', format: '#.##.##.##', levels: 4, transitionalType: 'balance', movementType: 'debtor', length: 7 },
    { id: 2, code: 'P', name: 'PASIVOS', format: '#.##.##.##', levels: 4, transitionalType: 'balance', movementType: 'creditor', length: 7 },
    { id: 3, code: 'R', name: 'RESULTADO', format: '#.##.##.##', levels: 4, transitionalType: 'result', movementType: 'creditor', length: 7 },
    { id: 4, code: 'T', name: 'PATRIMONIO', format: '#.##.##.##', levels: 4, transitionalType: 'balance', movementType: 'creditor', length: 7 },
];

export const initialAccounts: ChartOfAccount[] = [
    // Activos Corrientes
    { id: 1, code: '1010101', name: 'CAJA', type: 'Activo' },
    { id: 2, code: '1010102', name: 'BANCOS', type: 'Activo' },
    { id: 3, code: '1010210', name: 'DEPOSITO A PLAZO BANCOS', type: 'Activo' },
    { id: 4, code: '1010220', name: 'FONDOS MUTUOS', type: 'Activo' },
    { id: 5, code: '1010310', name: 'UTILES DE OFICINA', type: 'Activo' },
    { id: 6, code: '1010320', name: 'MATERIALES DE OFICINA', type: 'Activo' },
    { id: 7, code: '1010350', name: 'ANTICIPOS DE PROVEEDORES', type: 'Activo' },
    { id: 8, code: '1010351', name: 'ANTICIPOS PUBLICIDAD', type: 'Activo' },
    { id: 9, code: '1010352', name: 'ANTICIPOS DE HONORARIOS', type: 'Activo' },
    { id: 10, code: '1010353', name: 'ANTICIPOS DE SUELDOS', type: 'Activo' },
    { id: 11, code: '1010370', name: 'PRIMAS DE SEGURO', type: 'Activo' },
    { id: 12, code: '1010380', name: 'RENTAS PAGADAS POR ANTICIPADO', type: 'Activo' },
    { id: 13, code: '1010401', name: 'CLIENTES', type: 'Activo' },
    { id: 14, code: '1010415', name: 'HONORARIOS POR COBRAR', type: 'Activo' },
    { id: 15, code: '1010420', name: 'ESTIMACION DEUDORES INCOBRABLE', type: 'Activo' },
    { id: 16, code: '1010430', name: 'CHEQUES A FECHA', type: 'Activo' },
    { id: 17, code: '1010431', name: 'LETRAS POR COBRAR', type: 'Activo' },
    { id: 18, code: '1010432', name: 'PAGARES POR COBRAR', type: 'Activo' },
    { id: 19, code: '1010440', name: 'OTROS DOCUMENTOS POR COBRAR', type: 'Activo' },
    { id: 20, code: '1010501', name: 'CXC EMP. RELACIONADAS', type: 'Activo' },
    { id: 21, code: '1010610', name: 'MATERIAS PRIMAS', type: 'Activo' },
    { id: 22, code: '1010611', name: 'MATERIALES DIRECTOS', type: 'Activo' },
    { id: 23, code: '1010620', name: 'PRODUCTOS EN PROCESO', type: 'Activo' },
    { id: 24, code: '1010621', name: 'PRODUCTOS TERMINADOS', type: 'Activo' },
    { id: 25, code: '1010630', name: 'MERCADERIAS NACIONALES', type: 'Activo' },
    { id: 26, code: '1010640', name: 'IMPORTACIONES EN TRANSITO', type: 'Activo' },
    { id: 27, code: '1010690', name: 'PROVISION MERCADERIA OBSOLETA', type: 'Activo' },
    { id: 28, code: '1010701', name: 'ACTIVOS BIOLOGICOS CORRIENTES', type: 'Activo' },
    { id: 29, code: '1010801', name: 'PPM', type: 'Activo' },
    { id: 30, code: '1010802', name: 'IVA CREDITO FISCAL', type: 'Activo' },
    { id: 31, code: '1010803', name: 'IVA REMANENTE CREDITO FISCAL', type: 'Activo' },
    { id: 32, code: '1010804', name: 'IMPUESTO ADICIONAL', type: 'Activo' },
    { id: 33, code: '1010805', name: 'IMPUESTO ESPECIFICO', type: 'Activo' },
    { id: 34, code: '1010825', name: 'RETENCION HONORARIO POR COBRAR', type: 'Activo' },
    { id: 35, code: '1010910', name: 'ACTIVO MANT. PARA VENTA', type: 'Activo' },
    { id: 36, code: '1010920', name: 'ACTIVO MANT. PARA PROPIETARIOS', type: 'Activo' },
    // Activos No Corrientes
    { id: 37, code: '1020101', name: 'OTROS FINANCIEROS NO CORR.', type: 'Activo' },
    { id: 38, code: '1020201', name: 'ARRIENDOS EN GARANTIA POR REC.', type: 'Activo' },
    { id: 39, code: '1020301', name: 'DEUDORES A LARGO PLAZO', type: 'Activo' },
    { id: 40, code: '1020410', name: 'CXC A EMPRESA RELACIONADA L.P', type: 'Activo' },
    { id: 41, code: '1020420', name: 'DXC A EMPRESA RELACIONADA L.P', type: 'Activo' },
    { id: 42, code: '1020430', name: 'OTROS DXC A EMP RELACIONADA LP', type: 'Activo' },
    { id: 43, code: '1020501', name: 'INV. CONTAB. METODO PARTIC', type: 'Activo' },
    { id: 44, code: '1020601', name: 'DERECHOS DE AUTOR', type: 'Activo' },
    { id: 45, code: '1020602', name: 'MARCA REGISTRADA', type: 'Activo' },
    { id: 46, code: '1020603', name: 'PATENTES', type: 'Activo' },
    { id: 47, code: '1020604', name: 'SOFTWARE', type: 'Activo' },
    { id: 48, code: '1020605', name: 'FRANQUICIAS', type: 'Activo' },
    { id: 49, code: '1020606', name: 'GASTOS DE CONSTITUCION', type: 'Activo' },
    { id: 50, code: '1020701', name: 'PLUSVALIA', type: 'Activo' },
    { id: 51, code: '1020810', name: 'MAQUINARIAS Y EQUIPOS', type: 'Activo' },
    { id: 52, code: '1020811', name: 'DEP ACUM MAQUINARIAS Y EQUIPOS', type: 'Activo' },
    { id: 53, code: '1020820', name: 'MUEBLES Y UTILES', type: 'Activo' },
    { id: 54, code: '1020821', name: 'DEPR ACUM MUEBLES Y UTILES', type: 'Activo' },
    { id: 55, code: '1020824', name: 'EQUIPOS COMPUTACIONALES', type: 'Activo' },
    { id: 56, code: '1020825', name: 'DEP ACUM EQUIPOS COMPUTACIONAL', type: 'Activo' },
    { id: 57, code: '1020830', name: 'INSTALACIONES', type: 'Activo' },
    { id: 58, code: '1020831', name: 'DEPR ACUM INSTALACIONES', type: 'Activo' },
    { id: 59, code: '1020901', name: 'ACTIVOS BIOLOGICOS NO CORR.', type: 'Activo' },
    { id: 60, code: '1021001', name: 'PROPIEDAD DE INVERSION', type: 'Activo' },
    { id: 61, code: '1021101', name: 'ACTIVOS POR IMPUESTOS DIFERIDO', type: 'Activo' },
    // Pasivos Corrientes
    { id: 62, code: '2010101', name: 'DEUDAS CON BANCOS CORTO PLAZO', type: 'Pasivo' },
    { id: 63, code: '2010102', name: 'LINEA DE CREDITO BANCOS', type: 'Pasivo' },
    { id: 64, code: '2010120', name: 'ACREEDORES POR LEASING', type: 'Pasivo' },
    { id: 65, code: '2010130', name: 'OBLIGACIONES POR FACTORING', type: 'Pasivo' },
    { id: 66, code: '2010201', name: 'PROVEEDORES', type: 'Pasivo' },
    { id: 67, code: '2010210', name: 'CUENTAS POR PAGAR', type: 'Pasivo' },
    { id: 68, code: '2010211', name: 'PPM por Pagar', type: 'Pasivo' },
    { id: 69, code: '2010215', name: 'SUELDOS POR PAGAR', type: 'Pasivo' },
    { id: 70, code: '2010220', name: 'HONORARIOS POR PAGAR', type: 'Pasivo' },
    { id: 71, code: '2010225', name: 'IMPOSIONES POR PAGAR', type: 'Pasivo' },
    { id: 72, code: '2010401', name: 'CXP ENTIDAD RELACIONADA CORR.', type: 'Pasivo' },
    { id: 73, code: '2010590', name: 'PROVISIONES VARIAS', type: 'Pasivo' },
    { id: 74, code: '2010910', name: 'IMPUESTO UNICO TRABAJADORES', type: 'Pasivo' },
    { id: 75, code: '2010920', name: 'IVA DEBITO FISCAL', type: 'Pasivo' },
    { id: 76, code: '2010925', name: 'OUTROS IMPUESTOS', type: 'Pasivo' },
    { id: 77, code: '2010930', name: 'RETENCION IMPUESTO HONORARIOS', type: 'Pasivo' },
    { id: 78, code: '2010940', name: 'RETENCION INGRESO HONORARIO', type: 'Pasivo' },
    { id: 79, code: '2010990', name: 'PROVISION IMPUESTO A LA RENTA', type: 'Pasivo' },
    { id: 80, code: '2011001', name: 'PROVISION VACACIONES PERSONAL', type: 'Pasivo' },
    { id: 81, code: '2011101', name: 'INGRESOS PERCIBIDOS ADELANTADO', type: 'Pasivo' },
    { id: 82, code: '2011120', name: 'ARRIENDOS RECIBIDOS GARANTIA', type: 'Pasivo' },
    // Pasivos No Corrientes
    { id: 83, code: '2020101', name: 'DEUDAS CON BANCOS LARGO PLAZO', type: 'Pasivo' },
    { id: 84, code: '2020201', name: 'ACREEDORES LEASING A L.P.', type: 'Pasivo' },
    { id: 85, code: '2020301', name: 'CXP EMP. RELACIONADAS L.P.', type: 'Pasivo' },
    { id: 86, code: '2020302', name: 'CXP SOCIOS A L.P.', type: 'Pasivo' },
    { id: 87, code: '2020601', name: 'PROVISION INDEM. AÑOS SERVICIO', type: 'Pasivo' },
    // Patrimonio
    { id: 88, code: '30101', name: 'CAPITAL SOCIAL', type: 'Patrimonio' },
    { id: 89, code: '30102', name: 'CAPITAL PREFERENTE', type: 'Patrimonio' },
    { id: 90, code: '30201', name: 'PERDIDAS ACUMULADAS', type: 'Patrimonio' },
    { id: 91, code: '30202', name: 'UTILIDADES ACUMULADAS', type: 'Patrimonio' },
    { id: 92, code: '30301', name: 'CTA CTE SOCIO 1', type: 'Patrimonio' },
    { id: 93, code: '30302', name: 'CTA CTE SOCIO 2', type: 'Patrimonio' },
    { id: 94, code: '30601', name: 'REVALORIZACION CAPITAL PROPIO', type: 'Patrimonio' },
    // Resultados - Ingresos
    { id: 95, code: '4010110', name: 'VENTAS Y SERVICIOS AFECTOS', type: 'Resultado' },
    { id: 96, code: '4010120', name: 'VENTAS Y SERVICIOS EXENTOS', type: 'Resultado' },
    { id: 97, code: '4010130', name: 'EXPORTACIONES', type: 'Resultado' },
    // Resultados - Costos
    { id: 98, code: '4010210', name: 'COSTO VENTAS AFECTAS', type: 'Resultado' },
    { id: 99, code: '4010220', name: 'COSTO VENTAS EXENTAS', type: 'Resultado' },
    { id: 100, code: '4010230', name: 'COSTO EXPORTACIONES', type: 'Resultado' },
    { id: 101, code: '4010250', name: 'COSTOS DE COMISION EN VENTAS', type: 'Resultado' },
    { id: 102, code: '4010601', name: 'OTROS INGRESOS, POR FUNCION', type: 'Resultado' },
    { id: 103, code: '4010701', name: 'MOVILIZACION', type: 'Resultado' },
    // Resultados - Gastos
    { id: 104, code: '4010810', name: 'GASTOS DE SUELDOS Y SALARIOS', type: 'Resultado' },
    { id: 105, code: '4010812', name: 'GASTOS DE FONASA E ISAPRE', type: 'Resultado' },
    { id: 106, code: '4010813', name: 'GASTOS DE AFC EMPLEADOR', type: 'Resultado' },
    { id: 107, code: '4010814', name: 'GASTOS DE SEGURO DE INVALIDEZ', type: 'Resultado' },
    { id: 108, code: '4010815', name: 'GASTOS DE SEGURO ACCIDENTE', type: 'Resultado' },
    { id: 109, code: '4010816', name: 'GASTOS DE MOVILIZACION', type: 'Resultado' },
    { id: 110, code: '4010817', name: 'GASTOS DE COLACION', type: 'Resultado' },
    { id: 111, code: '4010818', name: 'BONOS Y OTROS', type: 'Resultado' },
    { id: 112, code: '4010822', name: 'HONORARIOS', type: 'Resultado' },
    { id: 113, code: '4010890', name: 'GASTOS GENERALES', type: 'Resultado' },
    { id: 114, code: '4010915', name: 'GASTOS DE MANTENIMIENTOS Y REP', type: 'Resultado' },
    { id: 115, code: '4010916', name: 'OTROS GASTOS, POR FUNCION', type: 'Resultado' },
    { id: 116, code: '4010917', name: 'Gastos de Mantenimiento y Rep', type: 'Resultado' },
    { id: 117, code: '4011010', name: 'OTRAS GANANCIAS', type: 'Resultado' },
    { id: 118, code: '4011020', name: 'OTRAS PERDIDAS', type: 'Resultado' },
    { id: 119, code: '4012110', name: 'INTERESES GANADOS', type: 'Resultado' },
    { id: 120, code: '4012210', name: 'COSTOS FINANCIEROS', type: 'Resultado' },
    { id: 121, code: '4012410', name: 'DIFERENCIAS DE CAMBIO', type: 'Resultado' },
    { id: 122, code: '4012501', name: 'REAJUSTE CREDITO IVA Y PPM', type: 'Resultado' },
    { id: 123, code: '4012570', name: 'REAJUSTE ACTIVOS EN UF', type: 'Resultado' },
    { id: 124, code: '4012590', name: 'REAJUSTE PASIVOS EN UF', type: 'Resultado' },
    { id: 125, code: '4019101', name: 'IMPUESTO A LA RENTA', type: 'Resultado' },
    { id: 126, code: '4019310', name: 'GANANCIAS OPE. DISCONTINUADAS', type: 'Resultado' },
    { id: 127, code: '4019320', name: 'PERDIDAS OPE. DISCONTINUADA', type: 'Resultado' },
    { id: 128, code: '40199', name: 'UTILIDAD CONSOLIDADA', type: 'Resultado' },
];
export const initialSubjects: Subject[] = [
    { id: 1, rut: '76.543.210-K', name: 'Proveedor de Oficina S.A.', type: 'Proveedor' }, 
    { id: 2, rut: '78.901.234-5', name: 'Cliente Mayorista Ltda.', type: 'Cliente' },
];
export const initialItems: Item[] = [
    { id: 1, sku: 'PROD-001', name: 'Resma de Papel Carta' }, { id: 2, sku: 'SERV-WEB', name: 'Servicio de Hosting Web Anual' },
];
export const initialCostCenters: CostCenter[] = [
    { id: 1, code: '1000', name: 'Administración' }, { id: 2, code: '2000', name: 'Ventas' },
];
export const initialEmployees: Employee[] = [
    { id: 1, rut: '15.123.456-7', name: 'Juan Pérez', position: 'Contador', hireDate: '2023-01-15', baseSalary: 1200000, afpId: 1, healthId: 18 }, 
    { id: 2, rut: '18.987.654-K', name: 'Ana Gómez', position: 'Vendedora', hireDate: '2022-05-20', baseSalary: 850000, afpId: 4, healthId: 15 },
];
export const initialInstitutions: Institution[] = [
    // AFPs
    { id: 1, name: 'Capital', type: 'AFP', rate: 1.44 },
    { id: 2, name: 'Cuprum', type: 'AFP', rate: 1.44 },
    { id: 3, name: 'Habitat', type: 'AFP', rate: 1.27 },
    { id: 4, name: 'Modelo', type: 'AFP', rate: 0.58 },
    { id: 5, name: 'Plan Vital', type: 'AFP', rate: 1.16 },
    { id: 6, name: 'Provida', type: 'AFP', rate: 1.45 },
    { id: 7, name: 'UNO', type: 'AFP', rate: 0.49 },
    // Isapres
    { id: 8, name: 'Banmédica', type: 'Isapre' },
    { id: 9, name: 'Banco Estado', type: 'Isapre' },
    { id: 10, name: 'Colmena', type: 'Isapre' },
    { id: 11, name: 'Consalud', type: 'Isapre' },
    { id: 12, name: 'Cruz Blanca', type: 'Isapre' },
    { id: 13, name: 'Esencial', type: 'Isapre' },
    { id: 14, name: 'Isapre Isalud', type: 'Isapre' },
    { id: 15, name: 'Nueva Masvida', type: 'Isapre' },
    { id: 16, name: 'Vida Tres', type: 'Isapre' },
    { id: 17, name: 'No Vigente Mas Vida', type: 'Isapre' },
    // Fonasa
    { id: 18, name: 'Fonasa', type: 'Fonasa' },
    // Otros
    { id: 19, name: 'Empart', type: 'Otro' },
    { id: 20, name: 'Servicio Seguro Social', type: 'Otro' },
    { id: 21, name: 'SIN AFP', type: 'Otro' },
    { id: 22, name: 'SIN ISAPRE', type: 'Otro' },
];
export const initialMonthlyParameters: MonthlyParameter[] = [
    { id: 1, period: '2025-10', name: 'UF', value: 37500.50 }, 
    { id: 2, period: '2025-10', name: 'UTM', value: 65182 },
    { id: 3, period: '2025-10', name: 'Tope Imponible', value: 3176292 }, // 84.7 UF * UF del mes
];
export const initialFamilyAllowanceBrackets: FamilyAllowanceBracket[] = [
    // 2024
    { id: 1, year: 2024, semester: 1, fromIncome: 0, toIncome: 539328, tranche: 'A', allowanceAmount: 20328 },
    { id: 2, year: 2024, semester: 1, fromIncome: 539329, toIncome: 787746, tranche: 'B', allowanceAmount: 12475 },
    { id: 3, year: 2024, semester: 1, fromIncome: 787747, toIncome: 1228614, tranche: 'C', allowanceAmount: 3942 },
    { id: 4, year: 2024, semester: 2, fromIncome: 0, toIncome: 586227, tranche: 'A', allowanceAmount: 21243 },
    { id: 5, year: 2024, semester: 2, fromIncome: 586228, toIncome: 856247, tranche: 'B', allowanceAmount: 13036 },
    { id: 6, year: 2024, semester: 2, fromIncome: 856248, toIncome: 1335450, tranche: 'C', allowanceAmount: 4119 },
    // 2023
    { id: 7, year: 2023, semester: 1, fromIncome: 0, toIncome: 515879, tranche: 'A', allowanceAmount: 20328 },
    { id: 8, year: 2023, semester: 1, fromIncome: 515880, toIncome: 753496, tranche: 'B', allowanceAmount: 12475 },
    { id: 9, year: 2023, semester: 1, fromIncome: 753497, toIncome: 1175196, tranche: 'C', allowanceAmount: 3942 },
    { id: 10, year: 2023, semester: 2, fromIncome: 0, toIncome: 539328, tranche: 'A', allowanceAmount: 20328 },
    { id: 11, year: 2023, semester: 2, fromIncome: 539329, toIncome: 787746, tranche: 'B', allowanceAmount: 12475 },
    { id: 12, year: 2023, semester: 2, fromIncome: 787747, toIncome: 1228614, tranche: 'C', allowanceAmount: 3942 },
     // 2022
    { id: 13, year: 2022, semester: 1, fromIncome: 0, toIncome: 398443, tranche: 'A', allowanceAmount: 15597 },
    { id: 14, year: 2022, semester: 1, fromIncome: 398444, toIncome: 581968, tranche: 'B', allowanceAmount: 9571 },
    { id: 15, year: 2022, semester: 1, fromIncome: 581969, toIncome: 907672, tranche: 'C', allowanceAmount: 3025 },
    { id: 16, year: 2022, semester: 2, fromIncome: 0, toIncome: 419414, tranche: 'A', allowanceAmount: 16418 },
    { id: 17, year: 2022, semester: 2, fromIncome: 419415, toIncome: 612598, tranche: 'B', allowanceAmount: 10075 },
    { id: 18, year: 2022, semester: 2, fromIncome: 612599, toIncome: 955444, tranche: 'C', allowanceAmount: 3184 },
];

// Tabla de Impuesto Único de Segunda Categoría (basada en valores reales, adaptada al período de la app)
export const initialIncomeTaxBrackets: IncomeTaxBracket[] = [
    { id: 1, period: '2025-10', fromUTM: 0, toUTM: 13.5, factor: 0, rebateUTM: 0 },
    { id: 2, period: '2025-10', fromUTM: 13.5, toUTM: 30, factor: 0.04, rebateUTM: 0.54 },
    { id: 3, period: '2025-10', fromUTM: 30, toUTM: 50, factor: 0.08, rebateUTM: 1.74 },
    { id: 4, period: '2025-10', fromUTM: 50, toUTM: 70, factor: 0.135, rebateUTM: 4.49 },
    { id: 5, period: '2025-10', fromUTM: 70, toUTM: 90, factor: 0.23, rebateUTM: 11.14 },
    { id: 6, period: '2025-10', fromUTM: 90, toUTM: 120, factor: 0.304, rebateUTM: 17.8 },
    { id: 7, period: '2025-10', fromUTM: 120, toUTM: 310, factor: 0.35, rebateUTM: 23.32 },
    { id: 8, period: '2025-10', fromUTM: 310, toUTM: null, factor: 0.4, rebateUTM: 38.82 },
];

export const initialPeriods: Period[] = [
    { value: '2025-10', label: 'Octubre 2025' }, { value: '2025-09', label: 'Septiembre 2025' },
];
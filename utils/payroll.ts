import type { Employee, Institution } from '../types';

// --- Constantes Legales (Actualizables para 2024) ---
// Estos valores deben ser actualizados periódicamente.
const VALOR_UF = 37500; // Ejemplo, se debería obtener de un servicio.
const TOPE_IMPONIBLE_AFP_SALUD_UF = 84.3;
const TOPE_IMPONIBLE_SEGURO_CESANTIA_UF = 126.6;
const INGRESO_MINIMO_MENSUAL = 460000;
const TOPE_GRATIFICACION_LEGAL = INGRESO_MINIMO_MENSUAL * 4.75;

// Tabla de Impuesto Único de Segunda Categoría (Ejemplo - necesita actualización)
const TABLA_IMPUESTO_UNICO = [
    { desde: 0, hasta: 999558, factor: 0, rebaja: 0 },
    { desde: 999558.01, hasta: 2221240, factor: 0.04, rebaja: 39982.32 },
    { desde: 2221240.01, hasta: 3702066, factor: 0.08, rebaja: 128831.92 },
    // ... (completar los otros tramos)
];

interface PayslipResult {
    employeeId: number;
    period: string; // "YYYY-MM"
    haberes: {
        sueldoBase: number;
        gratificacionLegal: number;
        colacion: number;
        movilizacion: number;
        totalImponible: number;
        totalNoImponible: number;
        totalHaberes: number;
    };
    descuentos: {
        cotizacionAFP: number;
        cotizacionSalud: number;
        seguroCesantia: number;
        impuestoUnico: number;
        totalDescuentos: number;
    };
    sueldoLiquido: number;
}

/**
 * Genera la liquidación de sueldo para un empleado en un período específico.
 * @param employee - El objeto completo del empleado.
 * @param institutions - Lista de todas las instituciones (para buscar tasas de AFP).
 * @param period - El período en formato "YYYY-MM".
 * @returns El objeto con el resultado de la liquidación.
 */
export function generatePayslipForEmployee(
    employee: Employee,
    institutions: Institution[],
    period: string
): PayslipResult {
    
    // 1. Calcular Haberes (Ingresos)
    const sueldoBase = employee.baseSalary || 0;
    
    const gratificacion = Math.min(sueldoBase * 0.25, TOPE_GRATIFICACION_LEGAL / 12);
    const gratificacionLegal = Math.round(gratificacion);

    const colacion = employee.monthly_meal_allowance || 0;
    const movilizacion = employee.monthly_transport_allowance || 0;

    const totalImponible = sueldoBase + gratificacionLegal;
    const totalNoImponible = colacion + movilizacion;
    const totalHaberes = totalImponible + totalNoImponible;

    // 2. Calcular Descuentos Legales
    const topeImponibleAFP = TOPE_IMPONIBLE_AFP_SALUD_UF * VALOR_UF;
    const baseAfpSalud = Math.min(totalImponible, topeImponibleAFP);

    // Cotización AFP
    const afp = institutions.find(i => i.id === employee.afpId);
    const tasaAFP = afp?.rate || 0; // Tasa de la AFP (ej. 11.44%) + comisión
    const cotizacionAFP = Math.round(baseAfpSalud * (tasaAFP / 100));

    // Cotización Salud
    const cotizacionSaludLegal = Math.round(baseAfpSalud * 0.07);
    // (Lógica para plan pactado en UF o $ si es mayor al 7% legal iría aquí)
    const cotizacionSalud = cotizacionSaludLegal;

    // Seguro de Cesantía
    const topeImponibleCesantia = TOPE_IMPONIBLE_SEGURO_CESANTIA_UF * VALOR_UF;
    const baseCesantia = Math.min(totalImponible, topeImponibleCesantia);
    const cotizacionCesantia = Math.round(baseCesantia * 0.006); // 0.6% para contrato indefinido

    // Impuesto Único
    const baseTributable = totalImponible - cotizacionAFP - cotizacionSalud - cotizacionCesantia;
    const tramoImpuesto = TABLA_IMPUESTO_UNICO.find(t => baseTributable > t.desde && baseTributable <= t.hasta);
    const impuestoUnico = tramoImpuesto ? Math.round((baseTributable * tramoImpuesto.factor) - tramoImpuesto.rebaja) : 0;

    const totalDescuentos = cotizacionAFP + cotizacionSalud + cotizacionCesantia + impuestoUnico;
    
    // 3. Calcular Sueldo Líquido
    const sueldoLiquido = totalHaberes - totalDescuentos;

    return {
        employeeId: employee.id,
        period,
        haberes: {
            sueldoBase,
            gratificacionLegal,
            colacion,
            movilizacion,
            totalImponible,
            totalNoImponible,
            totalHaberes,
        },
        descuentos: {
            cotizacionAFP,
            cotizacionSalud,
            seguroCesantia: cotizacionCesantia,
            impuestoUnico,
            totalDescuentos,
        },
        sueldoLiquido,
    };
}

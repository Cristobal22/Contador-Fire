
import type { Employee, Institution, PayslipCalculationResult, MonthlyParameter } from '../types';

/**
 * Creates a lookup object for monthly parameters for a specific period.
 * Throws an error if a required parameter is missing for that period.
 * @param params - The full list of monthly parameters from the database.
 * @param period - The period to filter for (e.g., "2023-10").
 * @returns A key-value object of parameters for the given period.
 */
const createPeriodParams = (params: MonthlyParameter[], period: string) => {
    const periodParams = params.filter(p => p.period === period);
    
    // Transform the array into a more accessible object like { UF: 37000, UTM: 65000, ... }
    const paramMap = periodParams.reduce((acc, param) => {
        acc[param.name] = param.value;
        return acc;
    }, {} as Record<string, number>);

    // Validate that all required parameters exist for the period
    const requiredKeys = ['UF', 'UTM', 'SueldoMinimo', 'TopeImponibleAFP', 'TopeImponibleAFC'];
    for (const key of requiredKeys) {
        if (paramMap[key] === undefined) {
            throw new Error(`Parámetro mensual requerido '${key}' no encontrado para el período ${period}. Por favor, configúrelo en la sección de parámetros.`);
        }
    }

    return paramMap;
};

/**
 * The core payroll calculation engine.
 *
 * @param employee The employee record.
 * @param institutions A list of all institutions (for AFP/Health rates).
 * @param period The period for the calculation (e.g., "2023-10").
 * @param monthlyParams The full list of monthly parameters from the database.
 * @returns The detailed payslip calculation result.
 */
export const generatePayslipForEmployee = (
    employee: Employee,
    institutions: Institution[],
    period: string,
    monthlyParams: MonthlyParameter[] // <-- PARÁMETROS REALES AHORA
): PayslipCalculationResult => {
    // Usa los parámetros reales y dinámicos para el período
    const params = createPeriodParams(monthlyParams, period);

    // 1. HABERES (Earnings)
    const sueldoBase = employee.baseSalary;

    // Gratificación legal (usa el SueldoMinimo real de los parámetros)
    const gratificacionCap = 4.75 * params.SueldoMinimo / 12;
    const gratificacionLegal = Math.min(sueldoBase * 0.25, gratificacionCap);

    const colacion = employee.mealAllowance || 0;
    const movilizacion = employee.transportAllowance || 0;
    
    const totalNoImponible = colacion + movilizacion;
    const totalImponible = sueldoBase + gratificacionLegal;
    const totalHaberes = totalImponible + totalNoImponible;

    // 2. DESCUENTOS (Deductions)
    
    // AFP Contribution (usa el TopeImponibleAFP real)
    const afp = institutions.find(i => i.id === employee.afpId);
    if (!afp) throw new Error(`Institución AFP no encontrada para el empleado ${employee.name}`);
    const baseAfp = Math.min(totalImponible, params.TopeImponibleAFP);
    const cotizacionAFP = baseAfp * (afp.rate / 100);

    // Health Contribution (usa la UF real)
    const health = institutions.find(i => i.id === employee.healthId);
    if (!health) throw new Error(`Institución de Salud no encontrada para el empleado ${employee.name}`);
    const planSaludPactadoUf = employee.healthPlanUf || 0;
    const planSaludPactadoPesos = planSaludPactadoUf * params.UF;
    const cotizacionLegalSalud = totalImponible * 0.07;
    const cotizacionSalud = Math.min(planSaludPactadoPesos, cotizacionLegalSalud);
    
    // Unemployment Insurance (AFC) (usa el TopeImponibleAFC real)
    const baseAfc = Math.min(totalImponible, params.TopeImponibleAFC);
    const seguroCesantia = baseAfc * 0.006;

    // Impuesto Único (usa la UTM real)
    // AVISO: El cálculo sigue siendo una simplificación. Un cálculo real requiere una tabla de tramos.
    const taxBase = totalImponible - cotizacionAFP - cotizacionSalud - seguroCesantia;
    let impuestoUnico = 0;
    if (taxBase > 13.5 * params.UTM) { 
        impuestoUnico = (taxBase - 13.5 * params.UTM) * 0.04;
    }

    const totalDescuentosLegales = cotizacionAFP + cotizacionSalud + seguroCesantia + impuestoUnico;
    
    const sueldoLiquido = totalHaberes - totalDescuentosLegales;

    return {
        employeeId: employee.id,
        period,
        haberes: {
            sueldoBase,
            gratificacionLegal,
            colacion,
            movilizacion,
            totalHaberes,
            totalImponible,
        },
        descuentos: {
            cotizacionAFP,
            cotizacionSalud,
            seguroCesantia,
            impuestoUnico,
            totalDescuentos: totalDescuentosLegales,
        },
        sueldoLiquido,
    };
};

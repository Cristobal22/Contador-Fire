
import type { Employee, Institution, PayslipCalculationResult } from '../types';

// A placeholder for fetching monthly parameters (UF, UTM, topes, etc.)
// In a real app, this would come from the database or an external API for the given period.
const getMonthlyParams = (period: string) => {
    // These are simplified, hardcoded values for demonstration.
    // In a real implementation, you would fetch these from your `monthly_parameters` table.
    return {
        UF: 37000,
        UTM: 65000,
        TopeImponibleAFP: 81.6 * 37000, // Approx 3,019,200
        TopeImponibleAFC: 122.6 * 37000, // Approx 4,536,200
    };
};

/**
 * The core payroll calculation engine.
 *
 * @param employee The employee record.
 * @param institutions A list of all institutions (for AFP/Health rates).
 * @param period The period for the calculation (e.g., "2023-10").
 * @returns The detailed payslip calculation result.
 */
export const generatePayslipForEmployee = (
    employee: Employee,
    institutions: Institution[],
    period: string
): PayslipCalculationResult => {
    const params = getMonthlyParams(period);

    // 1. HABERES (Earnings)
    const sueldoBase = employee.baseSalary;

    // Gratificación legal: 25% of salary with a cap of 4.75 * IMM (Ingreso Mínimo Mensual)
    // We'll use a placeholder IMM for now.
    const sueldoMinimo = 460000;
    const gratificacionCap = 4.75 * sueldoMinimo / 12;
    const gratificacionLegal = Math.min(sueldoBase * 0.25, gratificacionCap);

    const colacion = employee.mealAllowance || 0;
    const movilizacion = employee.transportAllowance || 0;
    
    // Other non-taxable income can be added here.
    const totalNoImponible = colacion + movilizacion;

    const totalImponible = sueldoBase + gratificacionLegal;
    const totalHaberes = totalImponible + totalNoImponible;

    // 2. DESCUENTOS (Deductions)
    
    // AFP Contribution
    const afp = institutions.find(i => i.id === employee.afpId);
    if (!afp) throw new Error(`AFP institution not found for employee ${employee.name}`);
    const baseAfp = Math.min(totalImponible, params.TopeImponibleAFP);
    const cotizacionAFP = baseAfp * (afp.rate / 100);

    // Health Contribution
    const health = institutions.find(i => i.id === employee.healthId);
    if (!health) throw new Error(`Health institution not found for employee ${employee.name}`);
    const planSaludPactadoUf = employee.healthPlanUf || 0;
    const planSaludPactadoPesos = planSaludPactadoUf * params.UF;
    const cotizacionLegalSalud = totalImponible * 0.07; // 7% legal minimum
    const cotizacionSalud = Math.min(planSaludPactadoPesos, cotizacionLegalSalud);
    
    // Unemployment Insurance (AFC)
    const baseAfc = Math.min(totalImponible, params.TopeImponibleAFC);
    // Assuming indefinite contract for simplicity (0.6% employee, 2.4% employer)
    const seguroCesantia = baseAfc * 0.006;

    // Impuesto Único (Simplified calculation)
    // This is a progressive tax. A real implementation would use a tax bracket table.
    // For simplicity, we'll apply a flat 4% on incomes over a certain threshold.
    const taxBase = totalImponible - cotizacionAFP - cotizacionSalud - seguroCesantia;
    let impuestoUnico = 0;
    if (taxBase > 13.5 * params.UTM) { // Simplified threshold
        impuestoUnico = (taxBase - 13.5 * params.UTM) * 0.04; // Simplified rate
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

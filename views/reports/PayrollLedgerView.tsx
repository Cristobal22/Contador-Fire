import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
    table: {
        fontSize: '12px',
    },
    th: {
        padding: '8px 12px',
        whiteSpace: 'nowrap',
    },
    td: {
        padding: '8px 12px',
        textAlign: 'right' as const,
    },
    employeeNameTd: {
        textAlign: 'left' as const,
        whiteSpace: 'nowrap',
    },
    tableFooter: {
        fontWeight: 'bold',
        backgroundColor: 'var(--sidebar-bg)',
    }
};


const PayrollLedgerView = () => {
    const { payslips, employees, activePeriod } = useSession();

    const payslipsForPeriod = useMemo(() => 
        payslips.filter(p => p.period === activePeriod),
        [payslips, activePeriod]
    );

    const getDeduction = (deductions: any[], name: string) => {
        return deductions.find(d => d.name.toLowerCase().includes(name.toLowerCase()))?.amount || 0;
    };
    
    const totals = useMemo(() => {
        return payslipsForPeriod.reduce((acc, p) => {
            acc.grossPay += p.grossPay;
            acc.taxableIncome += p.taxableIncome;
            acc.afp += getDeduction(p.deductions, 'afp');
            acc.health += getDeduction(p.deductions, 'salud');
            acc.unemployment += getDeduction(p.deductions, 'cesantía');
            acc.incomeTax += p.incomeTax;
            acc.totalDeductions += p.deductions.reduce((sum, d) => sum + d.amount, 0);
            acc.netPay += p.netPay;
            return acc;
        }, { grossPay: 0, taxableIncome: 0, afp: 0, health: 0, unemployment: 0, incomeTax: 0, totalDeductions: 0, netPay: 0 });
    }, [payslipsForPeriod]);

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.th, textAlign: 'left'}}>Empleado</th>
                        <th style={styles.th}>Sueldo Bruto</th>
                        <th style={styles.th}>Imponible</th>
                        <th style={styles.th}>AFP</th>
                        <th style={styles.th}>Salud</th>
                        <th style={styles.th}>Seg. Cesantía</th>
                        <th style={styles.th}>Imp. Único</th>
                        <th style={styles.th}>Total Desc.</th>
                        <th style={styles.th}>Sueldo Líquido</th>
                    </tr>
                </thead>
                <tbody>
                    {payslipsForPeriod.length > 0 ? payslipsForPeriod.map(p => {
                        const employee = employees.find(e => e.id === p.employeeId);
                        const totalDeductions = p.deductions.reduce((sum, d) => sum + d.amount, 0);
                        return (
                            <tr key={p.id}>
                                <td style={{...styles.td, ...styles.employeeNameTd}}>{employee?.name || 'N/A'}</td>
                                <td style={styles.td}>{p.grossPay.toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{p.taxableIncome.toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{getDeduction(p.deductions, 'afp').toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{getDeduction(p.deductions, 'salud').toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{getDeduction(p.deductions, 'cesantía').toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{p.incomeTax.toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{totalDeductions.toLocaleString('es-CL')}</td>
                                <td style={styles.td}>{p.netPay.toLocaleString('es-CL')}</td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={9}>No hay liquidaciones en este período.</td></tr>
                    )}
                </tbody>
                 <tfoot>
                    <tr style={styles.tableFooter}>
                        <td style={{...styles.td, textAlign: 'left'}}>Totales</td>
                        <td style={styles.td}>{totals.grossPay.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.taxableIncome.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.afp.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.health.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.unemployment.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.incomeTax.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.totalDeductions.toLocaleString('es-CL')}</td>
                        <td style={styles.td}>{totals.netPay.toLocaleString('es-CL')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default PayrollLedgerView;

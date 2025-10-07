import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' } as React.CSSProperties,
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    filterBar: { display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '24px' },
    certificateContainer: {
        marginTop: '2rem',
        padding: '2.5rem',
        border: '1px solid var(--border-color)',
        backgroundColor: '#fdfdfd',
        fontFamily: 'serif',
    },
    certHeader: { textAlign: 'center', marginBottom: '3rem' },
    certBody: { lineHeight: '1.8', fontSize: '16px', margin: '2rem 0' },
    certFooter: { marginTop: '5rem', textAlign: 'center' },
    signatureLine: {
        width: '250px',
        borderTop: '1px solid var(--text-color)',
        margin: '0 auto',
        paddingTop: '8px',
    },
    placeholder: {
        textAlign: 'center',
        color: 'var(--text-light-color)',
        padding: '3rem 0',
    }
} as const;

const RemunerationCertificateView = () => {
    const { employees, payslips, companies, activeCompanyId } = useSession();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [certificateData, setCertificateData] = useState<{ employeeName: string; totalGross: number; companyName: string; companyRut: string; } | null>(null);

    const availableYears = useMemo(() => {
        const years = new Set(payslips.map(p => new Date(p.period).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [payslips]);

    const handleGenerate = () => {
        if (!selectedEmployeeId || !selectedYear) return;

        const employee = employees.find(e => e.id === selectedEmployeeId);
        const company = companies.find(c => c.id === activeCompanyId);
        if (!employee || !company) return;

        const totalGross = payslips
            .filter(p => p.employeeId === selectedEmployeeId && p.period.startsWith(selectedYear.toString()))
            // FIX: Explicitly cast p.grossPay to a Number to ensure the arithmetic operation
            // in the reduce function is performed on numbers, preventing potential type errors.
            .reduce((sum: number, p) => sum + Number(p.grossPay), 0);
            
        setCertificateData({
            employeeName: employee.name,
            totalGross,
            companyName: company.name,
            companyRut: company.rut
        });
    };

    return (
        <div style={styles.panel}>
            <h3>Certificado de Remuneraciones</h3>
            <div style={styles.filterBar}>
                <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="employee-select">Empleado</label>
                    <select id="employee-select" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(Number(e.target.value))}>
                        <option value="" disabled>Seleccione un empleado...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                     <label htmlFor="year-select">Año</label>
                    <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedEmployeeId}>
                    <span className="material-symbols-outlined">description</span>Generar Certificado
                </button>
            </div>
            
            {certificateData ? (
                <div style={styles.certificateContainer}>
                    <div style={styles.certHeader}>
                        <h2 style={{textTransform: 'uppercase', marginBottom: '0.5rem'}}>Certificado de Renta</h2>
                        <h4 style={{fontWeight: 400}}>{certificateData.companyName}</h4>
                    </div>
                    <div style={styles.certBody}>
                        <p>
                            {certificateData.companyName}, RUT {certificateData.companyRut}, certifica que el Sr(a). <strong>{certificateData.employeeName}</strong>,
                            ha percibido una renta bruta total de <strong>{certificateData.totalGross.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</strong> durante el período
                            comprendido entre el 1 de enero y el 31 de diciembre del año {selectedYear}.
                        </p>
                        <p style={{marginTop: '1.5rem'}}>
                            Se extiende el presente certificado para los fines que el interesado estime convenientes.
                        </p>
                    </div>
                    <div style={styles.certFooter}>
                        <div style={styles.signatureLine}>
                           {certificateData.companyName}<br/>
                           Representante Legal
                        </div>
                    </div>
                </div>
            ) : (
                <div style={styles.placeholder}>
                    <p>Seleccione un empleado y un año para generar el certificado.</p>
                </div>
            )}
        </div>
    );
};

export default RemunerationCertificateView;
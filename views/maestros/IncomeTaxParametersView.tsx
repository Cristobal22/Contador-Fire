import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
};

const IncomeTaxParametersView = () => {
    const { incomeTaxBrackets, activePeriod, monthlyParameters } = useSession();

    const bracketsForPeriod = useMemo(() => {
        return incomeTaxBrackets.filter(b => b.period === activePeriod);
    }, [incomeTaxBrackets, activePeriod]);
    
    const utmValue = useMemo(() => {
        return monthlyParameters.find(p => p.period === activePeriod && p.name === 'UTM')?.value || 0;
    }, [monthlyParameters, activePeriod]);

    const formatRange = (from: number, to: number | null) => {
        if (to === null) {
            return `Más de ${from.toLocaleString('de-DE')} UTM`;
        }
        return `Desde ${from.toLocaleString('de-DE')} a ${to.toLocaleString('de-DE')} UTM`;
    };
    
    const formatRebate = (rebate: number) => {
        return `${rebate.toLocaleString('de-DE')} UTM`;
    };

    return (
        <div style={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th>Renta Líquida Imponible Mensual</th>
                        <th>Factor</th>
                        <th>Cantidad a Rebajar</th>
                    </tr>
                </thead>
                <tbody>
                    {bracketsForPeriod.length > 0 ? bracketsForPeriod.map(bracket => (
                        <tr key={bracket.id}>
                            <td>{formatRange(bracket.fromUTM, bracket.toUTM)}</td>
                            <td>{`${(bracket.factor * 100).toFixed(2)}%`}</td>
                            <td>{formatRebate(bracket.rebateUTM)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3}>No hay parámetros de IUT definidos para el período {activePeriod}.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default IncomeTaxParametersView;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import { formatRut } from '../utils/format';
import type { Company } from '../types';

const CompaniesView = () => {
    const session = useSession();
    const navigate = useNavigate();
    const { currentUser } = session;
    
    const userCompanies = (session.companies || []).filter(c => currentUser && c.owner_id === currentUser.id);

    const handleConfigureClick = (companyId: number) => {
        navigate(`/configuracion/general/empresas/${companyId}`);
    };

    return (
        <CrudView<Company>
            title="Empresa"
            columns={[
                { key: 'rut', header: 'RUT', render: (rut) => formatRut(rut) },
                { key: 'name', header: 'Razón Social' },
                { key: 'address', header: 'Dirección' },
                {
                    key: 'actions',
                    header: 'Configurar',
                    render: (_, record) => (
                        <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleConfigureClick(record.id)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle'}}>settings</span>
                        </button>
                    )
                }
            ]}
            data={userCompanies}
            onSave={(company) => session.addCompany(company)}
            onUpdate={session.updateCompany}
            onDelete={session.deleteCompany}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text', required: true },
                { name: 'name', label: 'Razón Social', type: 'text', required: true },
                { name: 'address', label: 'Dirección', type: 'text' },
            ]}
        />
    );
};

export default CompaniesView;

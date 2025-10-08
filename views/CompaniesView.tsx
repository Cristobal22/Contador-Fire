import React from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import { formatRut } from '../utils/format';
import type { Company } from '../types';

const CompaniesView = () => {
    const session = useSession();
    const { currentUser } = session;
    
    const userCompanies = (session.companies || []).filter(c => currentUser && c.owner_id === currentUser.id);

    return (
        <CrudView<Company>
            title="Empresa"
            columns={[
                { key: 'rut', header: 'RUT', render: (rut) => formatRut(rut) },
                { key: 'name', header: 'Razón Social' },
                { key: 'address', header: 'Dirección' }
            ]}
            data={userCompanies}
            onSave={session.addCompany}
            onUpdate={session.updateCompany}
            onDelete={session.deleteCompany}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text' },
                { name: 'name', label: 'Razón Social', type: 'text' },
                { name: 'address', label: 'Dirección', type: 'text' }
            ]}
        />
    );
};

export default CompaniesView;
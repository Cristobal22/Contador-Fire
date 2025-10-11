
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import { formatRut } from '../utils/format';
import type { Company, CompanyData } from '../types';
import { supabase } from '../supabaseClient';

const CompaniesView = () => {
    const { session, handleApiError, addNotification } = useSession();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const user = session?.user;

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };

        const fetchCompanies = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('owner_id', user.id);

            if (error) {
                handleApiError(error, 'cargando empresas');
                setCompanies([]);
            } else {
                setCompanies(data || []);
            }
            setIsLoading(false);
        };

        fetchCompanies();
    }, [user, handleApiError]);

    const handleConfigureClick = (companyId: number) => {
        navigate(`/configuracion/general/empresas/${companyId}`);
    };

    const handleSave = async (companyData: Omit<Company, 'id'>) => {
        if (!user) return;
        try {
            const dataToSave = { ...companyData, owner_id: user.id };
            const { data, error } = await supabase.from('companies').insert(dataToSave).select().single();
            if (error) throw error;
            setCompanies(prev => [...prev, data]);
            addNotification({ type: 'success', message: 'Empresa creada con éxito.' });
        } catch (error) {
            handleApiError(error, 'al crear la empresa');
        }
    };

    const handleUpdate = async (company: Company) => {
        try {
            const { data, error } = await supabase.from('companies').update(company).eq('id', company.id).select().single();
            if (error) throw error;
            setCompanies(prev => prev.map(c => c.id === company.id ? data : c));
            addNotification({ type: 'success', message: 'Empresa actualizada con éxito.' });
        } catch (error) {
            handleApiError(error, 'al actualizar la empresa');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase.from('companies').delete().eq('id', id);
            if (error) throw error;
            setCompanies(prev => prev.filter(c => c.id !== id));
            addNotification({ type: 'success', message: 'Empresa eliminada con éxito.' });
        } catch (error) {
            handleApiError(error, 'al eliminar la empresa');
        }
    };

    if (!session) return <div>Cargando...</div>;

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
            data={companies}
            loading={isLoading}
            onSave={handleSave}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            formFields={[
                { name: 'rut', label: 'RUT', type: 'text', required: true },
                { name: 'name', label: 'Razón Social', type: 'text', required: true },
                { name: 'address', label: 'Dirección', type: 'text' },
            ]}
        />
    );
};

export default CompaniesView;

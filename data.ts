
import { Institution } from './types';

export const afpInstitutions: Omit<Institution, 'id' | 'company_id'>[] = [
    { name: 'Capital', type: 'AFP', rate: 11.44, previred_code: '33', dt_code: '31' },
    { name: 'Cuprum', type: 'AFP', rate: 11.44, previred_code: '03', dt_code: '13' },
    { name: 'Habitat', type: 'AFP', rate: 11.27, previred_code: '05', dt_code: '14' },
    { name: 'Modelo', type: 'AFP', rate: 10.58, previred_code: '34', dt_code: '103' },
    { name: 'Plan Vital', type: 'AFP', rate: 11.16, previred_code: '29', dt_code: '11' },
    { name: 'Provida', type: 'AFP', rate: 11.45, previred_code: '08', dt_code: '6' },
    { name: 'Uno', type: 'AFP', rate: 10.49, previred_code: '35', dt_code: '19' },
    { name: 'Instituto de Previsión Social (IPS)', type: 'Otro', rate: 21.84, previred_code: '0101', dt_code: '85' },
    { name: 'Servicio Seguro Social', type: 'Otro', rate: 18.84, previred_code: '09', dt_code: '105' },
    { name: 'Sin AFP', type: 'Otro', rate: 0, previred_code: '00', dt_code: '100' },
];

export const isapreInstitutions: Omit<Institution, 'id' | 'company_id'>[] = [
    { name: 'Fonasa', type: 'Fonasa', rate: 7, previred_code: '07', dt_code: '102' },
    { name: 'Banmedica', type: 'Isapre', rate: 7, previred_code: '01', dt_code: '3' },
    { name: 'Banco Estado', type: 'Isapre', rate: 7, previred_code: '12', dt_code: '40' },
    { name: 'Colmena', type: 'Isapre', rate: 7, previred_code: '04', dt_code: '4' },
    { name: 'Consalud', type: 'Isapre', rate: 7, previred_code: '02', dt_code: '9' },
    { name: 'Cruz Blanca', type: 'Isapre', rate: 7, previred_code: '05', dt_code: '1' },
    { name: 'Esencial', type: 'Isapre', rate: 7, previred_code: '28', dt_code: '44' },
    { name: 'Isapre Isalud', type: 'Isapre', rate: 7, previred_code: '11', dt_code: '5' },
    { name: 'Nueva Masvida', type: 'Isapre', rate: 7, previred_code: '10', dt_code: '43' },
    { name: 'No Vigente Mas Vida', type: 'Isapre', rate: 7, previred_code: '17', dt_code: '43' },
    { name: 'Sin Isapre', type: 'Isapre', rate: 0, previred_code: '00', dt_code: '102' },
    { name: 'Vida Tres', type: 'Isapre', rate: 7, previred_code: '03', dt_code: '12' },
];

export const predefinedInstitutions: Omit<Institution, 'id' | 'company_id'>[] = [
    ...afpInstitutions,
    ...isapreInstitutions,
];


export const formatRut = (rut: string): string => {
    if (!rut) return '';
    let value = rut.replace(/\./g, '').replace('-', '');
    const body = value.slice(0, -1);
    const verifier = value.slice(-1).toUpperCase();
    let formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `${formattedBody}-${verifier}`;
};

export const unformatRut = (rut: string): string => {
    if (!rut) return '';
    return rut.replace(/\./g, '').replace('-', '');
};

export const parseRut = (rut: string): [string, string] => {
    if (!rut) return ['', ''];
    const cleanRut = unformatRut(rut);
    if (cleanRut.length < 2) return [cleanRut, ''];
    const body = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1).toUpperCase();
    return [body, verifier];
};

const getRutVerifier = (body: string): string => {
    let M = 0, T = 1;
    for (; body; body = body.slice(0, -1)) {
        T = (T + Number(body.slice(-1)) * (9 - M++ % 6)) % 11;
    }
    return T ? (T - 1).toString() : 'K';
};

export const validateRut = (rut: string): boolean => {
    if (!rut) return false;
    const cleanRut = unformatRut(rut);
    if (cleanRut.length < 2) return false;
    const body = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1).toUpperCase();
    return getRutVerifier(body) === verifier;
};

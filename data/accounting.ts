export const voucherTypes = [
    { code: 'Ingreso', name: 'Ingreso' },
    { code: 'Egreso', name: 'Egreso' },
    { code: 'Traspaso', name: 'Traspaso' },
];

export const feeInvoiceTaxRetentionRates = [
    { year: 2020, rate: 0.1075 },
    { year: 2021, rate: 0.1150 },
    { year: 2022, rate: 0.1225 },
    { year: 2023, rate: 0.13 },
    { year: 2024, rate: 0.1375 },
    { year: 2025, rate: 0.145 },
    { year: 2026, rate: 0.1525 }, // Assuming linear progression for missing years
    { year: 2027, rate: 0.16 },   // Assuming linear progression for missing years
    { year: 2028, rate: 0.17 },
];

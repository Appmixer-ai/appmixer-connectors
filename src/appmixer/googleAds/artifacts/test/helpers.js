'use strict';

const { Readable } = require('stream');

function csvStream(content) {
    const readable = new Readable();
    readable.push(content);
    readable.push(null);
    return readable;
}

function emailCsv(rows) {
    const header = 'email';
    const lines = rows.map(row => row.email);
    return [header, ...lines].join('\n');
}

const SHARED_CSV_HEADER = 'first_name,last_name,personal_emails,personal_phone,mobile_phone,additional_personal_emails,personal_emails_validation_status,personal_emails_last_seen,linkedin_url,personal_address,personal_address_2,personal_city,personal_state,personal_zip,personal_zip4,contact_country,gender,age_range,married,children,income_range,net_worth,homeowner,job_title,job_title_normalized,job_title_last_updated,seniority_level,seniority_level_2,department,department_2,business_email,programmatic_business_emails,business_email_validation_status,business_email_last_seen,direct_number,professional_address,professional_address_2,professional_city,professional_state,professional_zip,professional_zip4,company_name,company_domain,company_phone,company_sic,company_naics,company_address,company_city,company_state,company_zip,company_country,company_revenue,company_employee_count,primary_industry,company_last_updated,last_updated';

function sharedAudienceCsv(overrides = {}) {
    const columns = SHARED_CSV_HEADER.split(',');
    const defaults = {
        first_name: 'Avery',
        last_name: 'Stone',
        personal_emails: 'avery.stone@example.test',
        personal_phone: '+12025550101',
        mobile_phone: '+12025550102',
        additional_personal_emails: 'avery.alt@example.test',
        personal_emails_validation_status: 'Valid',
        personal_emails_last_seen: '2026-01-15 19:00:00',
        linkedin_url: 'https://linkedin.example.test/in/avery-stone',
        personal_address: '101 Cedar Ave',
        personal_city: 'Springfield',
        personal_state: 'IL',
        personal_zip: '62704',
        contact_country: 'US',
        gender: 'X',
        age_range: '35-44',
        married: 'N',
        homeowner: 'Y',
        job_title: 'Founder',
        job_title_normalized: 'founder',
        job_title_last_updated: '2026-01-10 08:00:00',
        seniority_level: 'Cxo',
        seniority_level_2: 'owner',
        department: 'Operations',
        department_2: 'Leadership',
        business_email: 'avery@work.example.test',
        programmatic_business_emails: '\\N',
        business_email_validation_status: 'Valid',
        business_email_last_seen: '2026-01-15 19:00:00',
        direct_number: '+12025550103',
        professional_address: '200 Market St',
        professional_city: 'Chicago',
        professional_state: 'IL',
        professional_zip: '60601',
        company_name: 'Example Company',
        company_domain: 'example.test',
        company_phone: '+12025550999',
        company_sic: '7372',
        company_naics: '541511',
        company_address: '200 Market St',
        company_city: 'Chicago',
        company_state: 'IL',
        company_zip: '60601',
        company_country: 'US',
        company_revenue: '5000000',
        company_employee_count: '25',
        primary_industry: 'Software',
        company_last_updated: '2026-01-12 10:00:00',
        last_updated: '2026-01-15 19:00:00'
    };

    const row = columns.map(column => overrides[column] ?? defaults[column] ?? '');
    return [SHARED_CSV_HEADER, row.join(',')].join('\n');
}

function googleAdsSchema(mappings) {
    return { ADD: mappings };
}

const BASIC_EMAIL_SCHEMA = googleAdsSchema([
    { csvHeader: 'email', googleAdsType: 'email' }
]);

function applyGoogleAdsConfig(context, overrides = {}) {
    context.config = {
        ...(context.config || {}),
        developerToken: 'dev-token',
        ...overrides
    };

    return context;
}

module.exports = {
    BASIC_EMAIL_SCHEMA,
    SHARED_CSV_HEADER,
    applyGoogleAdsConfig,
    csvStream,
    emailCsv,
    googleAdsSchema,
    sharedAudienceCsv
};

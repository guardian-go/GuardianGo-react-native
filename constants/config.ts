export const Config = {
  appName: 'Guardian Go',
  appVersion: '1.0.0',
  supportEmail: 'support@guardiango.ca',
  website: 'https://guardiango.ca',

  subscription: {
    trialDays: 30,
    plans: {
      basic: { price: 79, classes: 3 },
      standard: { price: 199, classes: 10 },
      premium: { price: 399, classes: Infinity },
    },
  },

  firestore: {
    collections: {
      users: 'users',
      students: 'students',
      schools: 'schools',
      pickupRecords: 'pickupRecords',
      consentRecords: 'consentRecords',
    },
  },
};
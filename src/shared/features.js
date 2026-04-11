export const FeatureTiers = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 5 database connections',
      'Basic query editor',
      'Dark/light themes',
      'Query history (last 100)',
      'Export to CSV'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 49,
    priceYearly: 99,
    features: [
      'Unlimited connections',
      'Advanced query editor with AI',
      'All themes + custom colors',
      'Unlimited query history',
      'Team sharing',
      'Query optimization suggestions',
      'Database backup/restore',
      'SSH tunnel support',
      'Priority support'
    ]
  },
  TEAM: {
    name: 'Team',
    price: 199,
    priceYearly: 399,
    features: [
      'Everything in Pro',
      '5+ team members',
      'Shared connections',
      'Query collaboration',
      'Audit logs',
      'Role-based access control',
      'Scheduled queries',
      'API access'
    ]
  }
};
// Legal page data types
export interface LegalSection {
  title: string;
  content: string;
  [key: string]: any; // Allow for additional subsections
}

export interface TermsData {
  meta: {
    title: string;
    lastUpdated: string;
    version: string;
  };
  sections: {
    [key: string]: LegalSection;
  };
}

export interface PrivacyData {
  meta: {
    title: string;
    lastUpdated: string;
    version: string;
  };
  controller: {
    title: string;
    content: string;
    details: {
      company: string;
      email: string;
      address: string;
      phone: string;
    };
  };
  dataCollection: {
    title: string;
    introduction: string;
    categories: {
      [key: string]: {
        title: string;
        description: string;
        examples: string[];
      };
    };
    required: {
      title: string;
      content: string;
    };
  };
  legalBasis: {
    title: string;
    introduction: string;
    bases: {
      [key: string]: {
        title: string;
        content: string;
      };
    };
  };
  purpose: {
    title: string;
    introduction: string;
    purposes: Array<{
      title: string;
      description: string;
    }>;
  };
  dataSharing: {
    title: string;
    introduction: string;
    categories: {
      [key: string]: {
        title: string;
        description: string;
        examples: string[];
      };
    };
    safeguards: {
      title: string;
      content: string;
    };
    noSale: {
      title: string;
      content: string;
    };
  };
  dataRetention: {
    title: string;
    introduction: string;
    periods: {
      [key: string]: {
        title: string;
        retention: string;
      };
    };
    automatic: {
      title: string;
      content: string;
    };
  };
  userRights: {
    title: string;
    introduction: string;
    rights: Array<{
      title: string;
      description: string;
    }>;
    exercise: {
      title: string;
      content: string;
    };
  };
  cookies: {
    title: string;
    introduction: string;
    categories: {
      [key: string]: {
        title: string;
        description: string;
        examples: string[];
      };
    };
    consent: {
      title: string;
      content: string;
    };
  };
  security: {
    title: string;
    introduction: string;
    technical: {
      title: string;
      measures: string[];
    };
    organizational: {
      title: string;
      measures: string[];
    };
    disclaimer: {
      title: string;
      content: string;
    };
  };
  children: {
    title: string;
    introduction: string;
    ageRestriction: {
      title: string;
      content: string;
    };
    parentalRights: {
      title: string;
      content: string;
    };
    childrenData: {
      title: string;
      content: string;
    };
  };
  aiPrivacy: {
    title: string;
    introduction: string;
    photoProcessing: {
      title: string;
      content: string;
    };
    retention: {
      title: string;
      content: string;
    };
    sharing: {
      title: string;
      content: string;
    };
    rights: {
      title: string;
      content: string;
    };
  };
  international: {
    title: string;
    introduction: string;
    transfers: {
      title: string;
      content: string;
    };
    providers: {
      title: string;
      examples: string[];
    };
  };
  marketing: {
    title: string;
    introduction: string;
    consent: {
      title: string;
      content: string;
    };
    types: {
      title: string;
      categories: string[];
    };
    optOut: {
      title: string;
      content: string;
    };
  };
  updates: {
    title: string;
    introduction: string;
    changes: {
      title: string;
      content: string;
    };
    review: {
      title: string;
      content: string;
    };
  };
  contact: {
    title: string;
    introduction: string;
    details: {
      email: string;
      address: string;
      phone: string;
      response: string;
    };
    authorities: {
      title: string;
      content: string;
    };
  };
}

export type LegalPageType = 'terms' | 'privacy';

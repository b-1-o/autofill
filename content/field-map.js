(() => {
  const FIELD_MAP = {
    firstName: [
      "first name",
      "firstname",
      "given name",
      "given-name",
      "fname",
      "first"
    ],
    lastName: [
      "last name",
      "lastname",
      "surname",
      "family name",
      "lname",
      "last"
    ],
    email: [
      "email",
      "e-mail",
      "email address",
      "emailaddress"
    ],
    phone: [
      "phone",
      "mobile",
      "cell",
      "telephone",
      "phone number",
      "mobile phone",
      "cell phone",
      "contact number"
    ],
    location: [
      "location",
      "city",
      "home city",
      "current city",
      "city state",
      "city/state",
      "location city",
      "address"
    ],
    company: [
      "company",
      "company name",
      "current company",
      "employer",
      "current employer",
      "organization",
      "present company",
      "present employer"
    ],
    linkedin: [
      "linkedin",
      "linkedin url",
      "linkedin profile",
      "linkedin profile url"
    ],
    github: [
      "github",
      "github url",
      "github profile",
      "github profile url"
    ],
    portfolio: [
      "portfolio",
      "portfolio url",
      "website",
      "website url",
      "personal site",
      "personal website",
      "personal website url",
      "personal website address"
    ],
    yearsOfExperience: [
      "years of experience",
      "years experience",
      "experience years",
      "total years experience",
      "total experience"
    ],
    authorizedToWork: [
      "authorized to work",
      "work authorization",
      "legally authorized",
      "legally eligible",
      "eligible to work",
      "right to work",
      "authorized for employment",
      "authorized to work in the us",
      "authorized to work in united states"
    ],
    requiresSponsorship: [
      "requires sponsorship",
      "require sponsorship",
      "sponsorship",
      "visa sponsorship",
      "future sponsorship",
      "need sponsorship",
      "will you require sponsorship"
    ]
  };

  const FIELD_LABELS = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    company: "Company",
    linkedin: "LinkedIn",
    github: "GitHub",
    portfolio: "Portfolio",
    yearsOfExperience: "Years of experience",
    authorizedToWork: "Authorized to work",
    requiresSponsorship: "Requires sponsorship"
  };

  const FIELD_ORDER =
    Object.keys(
      FIELD_MAP
    );

  globalThis.__B1O_FIELD_MAP__ =
    Object.freeze(FIELD_MAP);

  globalThis.__B1O_FIELD_LABELS__ =
    Object.freeze(FIELD_LABELS);

  globalThis.__B1O_FIELD_ORDER__ =
    Object.freeze(FIELD_ORDER);
})();

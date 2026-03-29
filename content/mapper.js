(function initSmartFillerMapper(global) {
  const FIELD_RULES = [
    {
      fieldType: "first_name",
      keywords: ["first name", "given name", "firstname", "fname"],
      autocomplete: ["given-name"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "last_name",
      keywords: ["last name", "surname", "family name", "lastname", "lname"],
      autocomplete: ["family-name"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "full_name",
      keywords: ["full name", "name", "contact name", "applicant name"],
      autocomplete: ["name"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "email",
      keywords: ["email", "e-mail", "email address"],
      autocomplete: ["email"],
      elementTypes: ["input"],
      inputTypes: ["email", "text", ""]
    },
    {
      fieldType: "phone",
      keywords: ["phone", "mobile", "telephone", "contact number", "phone number"],
      autocomplete: ["tel", "tel-national"],
      elementTypes: ["input"],
      inputTypes: ["tel", "text", "number", ""]
    },
    {
      fieldType: "address_line_1",
      keywords: ["address", "street", "address line 1", "street address"],
      autocomplete: ["street-address", "address-line1"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "city",
      keywords: ["city", "town"],
      autocomplete: ["address-level2"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "state",
      keywords: ["state", "province", "region"],
      autocomplete: ["address-level1"],
      elementTypes: ["input", "select"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "postal_code",
      keywords: ["zip", "zip code", "postal", "postal code", "pincode", "pin code"],
      autocomplete: ["postal-code"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", "number", ""]
    },
    {
      fieldType: "company",
      keywords: ["company", "organization", "organisation", "employer", "business"],
      autocomplete: ["organization"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "job_title",
      keywords: ["job title", "title", "role", "designation", "position"],
      autocomplete: ["organization-title"],
      elementTypes: ["input"],
      inputTypes: ["text", "search", ""]
    },
    {
      fieldType: "password",
      keywords: ["password", "passcode"],
      autocomplete: ["new-password", "current-password"],
      elementTypes: ["input"],
      inputTypes: ["password"]
    },
    {
      fieldType: "date",
      keywords: ["date", "dob", "birth date", "start date"],
      autocomplete: ["bday"],
      elementTypes: ["input"],
      inputTypes: ["date"]
    },
    {
      fieldType: "datetime",
      keywords: ["datetime", "appointment"],
      autocomplete: [],
      elementTypes: ["input"],
      inputTypes: ["datetime-local"]
    },
    {
      fieldType: "time",
      keywords: ["time", "appointment time", "preferred time"],
      autocomplete: [],
      elementTypes: ["input"],
      inputTypes: ["time"]
    },
    {
      fieldType: "url",
      keywords: ["website", "site", "url", "portfolio", "link"],
      autocomplete: ["url"],
      elementTypes: ["input"],
      inputTypes: ["url", "text", ""]
    },
    {
      fieldType: "notes",
      keywords: ["notes", "message", "comments", "description", "project notes"],
      autocomplete: [],
      elementTypes: ["textarea", "contenteditable", "input"],
      inputTypes: ["text", "search", ""]
    }
  ];

  function scoreRule(field, rule) {
    let score = 0;
    const reasons = [];

    if (!rule.elementTypes.includes(field.elementType)) {
      return { score: 0, reasons: [] };
    }

    score += 0.1;
    reasons.push(`element:${field.elementType}`);

    if (field.elementType === "input" && rule.inputTypes.includes(field.inputType || "")) {
      score += 0.15;
      reasons.push(`input:${field.inputType || "text"}`);
    }

    if (field.autocomplete) {
      const autocompleteMatch = rule.autocomplete.find((value) => field.autocomplete === value);
      if (autocompleteMatch) {
        score += 0.45;
        reasons.push(`autocomplete:${autocompleteMatch}`);
      }
    }

    const matchedKeywords = rule.keywords.filter((keyword) => field.textSignals.includes(keyword));
    if (matchedKeywords.length > 0) {
      score += Math.min(0.55, matchedKeywords.length * 0.2);
      reasons.push(`keywords:${matchedKeywords.join(", ")}`);
    }

    if (rule.fieldType === "email" && field.inputType === "email") {
      score += 0.4;
      reasons.push("native-email");
    }

    if (rule.fieldType === "phone" && field.inputType === "tel") {
      score += 0.4;
      reasons.push("native-tel");
    }

    if (rule.fieldType === "password" && field.inputType === "password") {
      score += 0.5;
      reasons.push("native-password");
    }

    if (rule.fieldType === "url" && field.inputType === "url") {
      score += 0.4;
      reasons.push("native-url");
    }

    if (rule.fieldType === "date" && field.inputType === "date") {
      score += 0.5;
      reasons.push("native-date");
    }

    if (rule.fieldType === "datetime" && field.inputType === "datetime-local") {
      score += 0.5;
      reasons.push("native-datetime");
    }

    if (rule.fieldType === "time" && field.inputType === "time") {
      score += 0.5;
      reasons.push("native-time");
    }

    return {
      score: Math.min(score, 1),
      reasons
    };
  }

  function buildFallbackMapping(field) {
    if (field.elementType === "textarea" || field.elementType === "contenteditable") {
      return {
        field,
        fieldType: "notes",
        confidence: 0.5,
        reasons: ["fallback:long-text"]
      };
    }

    if (field.elementType === "select") {
      return {
        field,
        fieldType: "select_choice",
        confidence: 0.55,
        reasons: ["fallback:select"]
      };
    }

    if (field.elementType === "input") {
      if (field.inputType === "checkbox") {
        return {
          field,
          fieldType: "checkbox",
          confidence: 0.95,
          reasons: ["native-checkbox"]
        };
      }

      if (field.inputType === "radio") {
        return {
          field,
          fieldType: "radio_group",
          confidence: 0.95,
          reasons: ["native-radio"]
        };
      }

      if (field.inputType === "number" || field.inputType === "range") {
        return {
          field,
          fieldType: field.inputType === "range" ? "range" : "number",
          confidence: 0.85,
          reasons: [`native-${field.inputType}`]
        };
      }

      if (field.inputType === "color") {
        return {
          field,
          fieldType: "color",
          confidence: 0.95,
          reasons: ["native-color"]
        };
      }

      if (field.inputType === "search" || field.inputType === "text" || field.inputType === "") {
        return {
          field,
          fieldType: "full_name",
          confidence: 0.2,
          reasons: ["fallback:text"]
        };
      }
    }

    return {
      field,
      fieldType: "unknown",
      confidence: 0,
      reasons: ["unsupported"]
    };
  }

  function mapField(field) {
    return FIELD_RULES.reduce((best, rule) => {
      const next = scoreRule(field, rule);

      if (next.score > best.confidence) {
        return {
          field,
          fieldType: rule.fieldType,
          confidence: next.score,
          reasons: next.reasons
        };
      }

      return best;
    }, buildFallbackMapping(field));
  }

  function mapFields(fields) {
    const mappedFields = (fields || []).map(mapField);

    return {
      mappedFields,
      lowConfidenceFields: mappedFields.filter(
        (mapping) =>
          mapping.confidence > 0 &&
          mapping.confidence < global.SmartFillerConstants.LOW_CONFIDENCE_THRESHOLD
      )
    };
  }

  global.SmartFillerMapper = {
    mapFields
  };
})(window);

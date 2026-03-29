(function initSmartFillerGenerator(global) {
  function applyFakerLocale(fillSettings) {
    if (typeof faker === "undefined") {
      return "unavailable";
    }

    const fakerLocale = fillSettings && fillSettings.region === "IN" ? "en_IND" : "en";
    faker.locale = fakerLocale;
    return fakerLocale;
  }

  function createGenerationContext(fillSettings) {
    const fakerLocale = applyFakerLocale(fillSettings);

    return {
      locale: fillSettings.locale,
      language: fillSettings.language,
      region: fillSettings.region,
      fakerLocale
    };
  }

  function generateNumberValue(field) {
    const parsedMin = Number(field.element.min);
    const parsedMax = Number(field.element.max);
    const min = Number.isFinite(parsedMin) ? parsedMin : 1;
    const max = Number.isFinite(parsedMax) ? parsedMax : Math.max(min + 1000, 9999);

    return faker.datatype.number({ min, max }).toString();
  }

  function generateRangeValue(field) {
    const min = parseInt(field.element.min, 10) || 0;
    const max = parseInt(field.element.max, 10) || 100;
    return String(faker.datatype.number({ min, max }));
  }

  function generateValue(options) {
    const mapping = options.mapping;
    const field = mapping.field;

    if (typeof faker === "undefined") {
      return null;
    }

    switch (mapping.fieldType) {
      case "first_name":
        return faker.name.firstName();
      case "last_name":
        return faker.name.lastName();
      case "full_name":
        return faker.name.findName();
      case "email":
        return faker.internet.email();
      case "phone":
        return faker.phone.phoneNumber("##########");
      case "address_line_1":
        return faker.address.streetAddress();
      case "city":
        return faker.address.city();
      case "state":
        return faker.address.state();
      case "postal_code":
        return faker.address.zipCode();
      case "company":
        return faker.company.companyName();
      case "job_title":
        return faker.name.jobTitle();
      case "password":
        return faker.internet.password(10);
      case "date":
        return faker.date.past(20).toISOString().split("T")[0];
      case "datetime":
        return faker.date.past(5).toISOString().slice(0, 16);
      case "time":
        return faker.date.recent().toTimeString().slice(0, 5);
      case "url":
        return faker.internet.url();
      case "notes":
        return faker.lorem.sentences(2);
      case "number":
        return generateNumberValue(field);
      case "range":
        return generateRangeValue(field);
      case "color":
        return faker.internet.color();
      case "checkbox":
        return faker.datatype.boolean();
      case "radio_group":
        return true;
      default:
        return null;
    }
  }

  global.SmartFillerGenerator = {
    createGenerationContext,
    generateValue
  };
})(window);

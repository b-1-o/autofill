(() => {
  function dispatchEvents(
    el,
    events = ["input", "change", "blur"]
  ) {
    for (const type of events) {
      el.dispatchEvent(
        new Event(type, {
          bubbles: true
        })
      );
    }
  }

  function setNativeValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;

    const descriptor =
      Object.getOwnPropertyDescriptor(
        proto,
        "value"
      );

    if (!descriptor?.set) {
      throw new Error(
        "Native value setter is unavailable"
      );
    }

    descriptor.set.call(
      el,
      value
    );

    dispatchEvents(el, [
      "input",
      "change",
      "blur"
    ]);
  }

  function normalize(value) {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function setSelect(el, value) {
    const target = normalize(value);

    if (!target) {
      return false;
    }

    const options = [...el.options];

    const exactIndex =
      options.findIndex((option) => {
        const text =
          normalize(option.textContent);

        const optionValue =
          normalize(option.value);

        return (
          text === target ||
          optionValue === target
        );
      });

    const fuzzyIndex =
      options.findIndex((option) => {
        const text =
          normalize(option.textContent);

        const optionValue =
          normalize(option.value);

        return (
          text.includes(target) ||
          target.includes(text) ||
          optionValue.includes(target) ||
          target.includes(optionValue)
        );
      });

    const index =
      exactIndex >= 0
        ? exactIndex
        : fuzzyIndex;

    if (index < 0) {
      return false;
    }

    const current =
      options[el.selectedIndex];

    if (
      current &&
      (
        normalize(current.textContent) === target ||
        normalize(current.value) === target
      )
    ) {
      return false;
    }

    el.selectedIndex = index;

    dispatchEvents(el, [
      "input",
      "change"
    ]);

    return true;
  }

  function getChoiceText(input) {
    const values = [
      input.value,
      input.getAttribute("aria-label")
    ];

    if (input.id) {
      const label =
        document.querySelector(
          'label[for="' +
            CSS.escape(input.id) +
            '"]'
        );

      if (label) {
        values.push(
          label.textContent
        );
      }
    }

    const parentLabel =
      input.closest("label");

    if (parentLabel) {
      values.push(
        parentLabel.textContent
      );
    }

    return normalize(
      values
        .filter(Boolean)
        .join(" ")
    );
  }

  function setRadioOrCheckbox(
    name,
    value,
    root = document
  ) {
    const target = normalize(value);

    if (!name || !target) {
      return false;
    }

    const selector =
      'input[name="' +
      CSS.escape(name) +
      '"][type="radio"], input[name="' +
      CSS.escape(name) +
      '"][type="checkbox"]';

    const group = [
      ...root.querySelectorAll(selector)
    ];

    if (!group.length) {
      return false;
    }

    if (
      group.some(
        (input) => input.checked
      )
    ) {
      return false;
    }

    const match =
      group.find((input) => {
        const text =
          getChoiceText(input);

        if (target === "yes") {
          return (
            text === "yes" ||
            text.startsWith("yes ")
          );
        }

        if (target === "no") {
          return (
            text === "no" ||
            text.startsWith("no ")
          );
        }

        return (
          text === target ||
          text.includes(target)
        );
      });

    if (!match) {
      return false;
    }

    match.click();

    return true;
  }

  globalThis.__B1O_FIELD_SETTER__ =
    Object.freeze({
      setNativeValue,
      setSelect,
      setRadioOrCheckbox,
      dispatchEvents
    });
})();

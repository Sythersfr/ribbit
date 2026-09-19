(() => {
  const config = document.getElementById("ribbit-bundle-config");
  if (!config) return;

  const cameraVariant = Number(config.dataset.cameraVariant);
  const guardVariant = Number(config.dataset.guardVariant);
  const sellingPlan = Number(config.dataset.sellingPlan);

  function enhanceProductForm() {
    const form = document.querySelector(
      'form[action*="/cart/add"]:has(button[name="add"])',
    );
    if (!form || form.dataset.ribbitBundle === "true") return;
    form.dataset.ribbitBundle = "true";
    const submit = form.querySelector('[type="submit"]');
    if (submit) (submit.querySelector("span") || submit).textContent = "Add camera + Guard Pro";

    const note = document.createElement("div");
    note.className = "ribbit-bundle-card";
    note.innerHTML = `
      <div class="ribbit-bundle-card__eyebrow">RIBBIT BUNDLE</div>
      <strong>Lumen Cam + Guard Pro</strong>
      <p>$249 today, then $12/month for AI alerts, cloud archive, and 3 seats.</p>
      <span>Monthly subscription included at checkout</span>`;
    form.parentNode?.insertBefore(note, form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (submit) submit.setAttribute("aria-disabled", "true");
      try {
        const quantity = Number(form.querySelector('[name="quantity"]')?.value || 1);
        const response = await fetch(`${window.Shopify?.routes?.root || "/"}cart/add.js`, {
          method: "POST",
          headers: {"Content-Type": "application/json", Accept: "application/json"},
          body: JSON.stringify({
            items: [
              {id: cameraVariant, quantity},
              {
                id: guardVariant,
                quantity: 1,
                selling_plan: sellingPlan,
                properties: {"Ribbit plan": "Guard Pro monthly"},
              },
            ],
          }),
        });
        if (!response.ok) throw new Error((await response.json()).description || "Unable to add bundle");
        window.location.assign(`${window.Shopify?.routes?.root || "/"}cart`);
      } catch (error) {
        alert(`Ribbit couldn't add the bundle: ${error.message}`);
        if (submit) submit.removeAttribute("aria-disabled");
      }
    }, true);
  }

  enhanceProductForm();
  new MutationObserver(enhanceProductForm).observe(document.body, {childList: true, subtree: true});
})();

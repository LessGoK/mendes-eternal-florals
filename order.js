console.log("🔥 order.js loaded");

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   HELPER
========================= */
function hideHintOnSelect(inputName, labelClass) {
  document.querySelectorAll(`input[name="${inputName}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        document
          .querySelector(`.${labelClass} .required-hint`)
          ?.classList.add("hidden");
      }
    });
  });
}

/* =========================
   STEP NAVIGATION
========================= */
let currentStep = 1;
const totalSteps = 3;

function validateStep(step) {
  if (step === 1) {
    let valid = true;

    const roses = document.querySelector('input[name="roses"]:checked');
    const rosesHint = document.querySelector(".roses-label .required-hint");
    if (!roses) {
      rosesHint?.classList.remove("hidden");
      valid = false;
    } else rosesHint?.classList.add("hidden");

    const color = document.querySelector('input[name="color"]:checked');
    const colorHint = document.querySelector(".color-label .required-hint");
    if (!color) {
      colorHint?.classList.remove("hidden");
      valid = false;
    } else colorHint?.classList.add("hidden");

    const wrapper = document.querySelector('input[name="wrapper"]:checked');
    const wrapperHint = document.querySelector(".wrapper-label .required-hint");
    if (!wrapper) {
      wrapperHint?.classList.remove("hidden");
      valid = false;
    } else wrapperHint?.classList.add("hidden");

    if (!valid) {
      document.querySelector(".required-hint:not(.hidden)")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    return valid;
  }

  if (step === 2) {
    let valid = true;

    const fullname = document.getElementById("fullname");
    const whatsapp = document.getElementById("whatsapp");
    const address = document.querySelector('input[name="address"]:checked');
    const otherRadio = document.getElementById("otherAddress");
    const customAddress = document.getElementById("customAddress");

    if (!fullname.value.trim()) {
      fullname.classList.add("error");
      valid = false;
    } else fullname.classList.remove("error");

    if (!whatsapp.value.trim()) {
      whatsapp.classList.add("error");
      valid = false;
    } else whatsapp.classList.remove("error");

    if (!address) {
      alert("Please select a delivery address");
      valid = false;
    }

    if (otherRadio?.checked && !customAddress?.value.trim()) {
      customAddress.classList.add("error");
      alert("Please enter your delivery address");
      valid = false;
    } else customAddress?.classList.remove("error");

    if (!valid) {
      document.querySelector(".error")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    return valid;
  }

  if (step === 3) {
    const agree = document.getElementById("agreeTerms");
    const error = document.getElementById("agreeError");
    if (!agree.checked) {
      error.classList.remove("hidden");
      agree.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    error.classList.add("hidden");
    return true;
  }

  return true;
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    currentStep++;
    const nextSection = document.getElementById("step" + currentStep);
    nextSection?.classList.add("active");
    nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

window.nextStep = nextStep;

/* =========================
   LIVE CALCULATOR
========================= */
function calculateTotal() {
  let total = 0;
  let breakdown = [];

  const roses = document.querySelector('input[name="roses"]:checked');
  if (roses) {
    total += Number(roses.dataset.price || 0);
    breakdown.push(`Roses: R${roses.dataset.price}`);
  }

  document.querySelectorAll('input[name="addons"]:checked').forEach((a) => {
    total += Number(a.dataset.price || 0);
    breakdown.push(`${a.value}: R${a.dataset.price}`);
  });

  document.getElementById("breakdown").innerHTML = breakdown.join("<br>");
  document.getElementById("total").textContent = total;
}

document.addEventListener("change", calculateTotal);
calculateTotal();

/* =========================
   ADDRESS TOGGLE
========================= */
document.addEventListener("change", (e) => {
  if (!e.target.matches('input[name="address"]')) return;
  const customAddress = document.getElementById("customAddress");
  const other = document.getElementById("otherAddress");
  if (other?.checked) {
    customAddress?.classList.remove("hidden");
  } else {
    customAddress?.classList.add("hidden");
    if (customAddress) customAddress.value = "";
  }
});

/* =========================
   MODAL
========================= */
function closeModal() {
  document.getElementById("orderModal")?.classList.add("hidden");
  document.body.style.overflow = "auto";
  window.location.href = "index.html";
}
window.closeModal = closeModal;

/* =========================
   FIREBASE LOADERS
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const roseOptions = document.getElementById("roseOptions");
  const roseColors = document.getElementById("roseColors");
  const multiColors = document.getElementById("multiColors");
  const bowColors = document.getElementById("bowColors");
  const wrapperColors = document.getElementById("wrapperColors");
  const addonList = document.getElementById("addonList");

  // ── ROSES ──
  async function loadRoses() {
    const q = query(collection(db, "roseOptions"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q); // ✅ USE THE QUERY
    roseOptions.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="option">
          <input type="radio" name="roses" value="${d.name}" data-price="${d.price}" />
          <span>${d.name}<br><small>R${d.price}</small></span>
        </label>`;
      })
      .join("");
    hideHintOnSelect("roses", "roses-label");
  }

  // ── ROSE COLORS (also fills multicolor) ──
  async function loadRoseColors() {
    const snap = await getDocs(collection(db, "roseColors"));

    // rose color radio buttons
    roseColors.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="image-card">
          <input type="radio" name="color" value="${d.name}" data-image="${d.image || ""}" />
          <img src="${d.image || ""}" alt="${d.name}" />
          <span>${d.name}</span>
        </label>`;
      })
      .join("");

    // multicolor CHECKBOXES (so user can pick multiple)
    multiColors.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="image-card">
          <input type="checkbox" name="multi-color" value="${d.name}" data-image="${d.image || ""}" />
          <img src="${d.image || ""}" alt="${d.name}" />
          <span>${d.name}</span>
        </label>`;
      })
      .join("");

    // bow colors also use rose colors
    bowColors.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="image-card">
          <input type="radio" name="bow-style" value="${d.name}" data-image="${d.image || ""}" />
          <img src="${d.image || ""}" alt="${d.name}" />
          <span>${d.name}</span>
        </label>`;
      })
      .join("");

    hideHintOnSelect("color", "color-label");
  }

  // ── WRAPPERS ──
  async function loadWrappers() {
    const snap = await getDocs(collection(db, "wrapperColors"));
    wrapperColors.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="image-card">
          <input type="radio" name="wrapper" value="${d.name}" data-image="${d.image || ""}" />
          <img src="${d.image || ""}" alt="${d.name}" />
          <span>${d.name}</span>
        </label>`;
      })
      .join("");
    hideHintOnSelect("wrapper", "wrapper-label");
  }

  // ── ADD-ONS ──
  async function loadAddons() {
    const snap = await getDocs(collection(db, "addons"));
    addonList.innerHTML = snap.docs
      .map((doc) => {
        const d = doc.data();
        return `
        <label class="image-card add-on">
          <input type="checkbox" name="addons" value="${d.name}" data-price="${d.price}" />
          <img src="${d.image || ""}" alt="${d.name}" />
          <span>${d.name}</span>
        </label>`;
      })
      .join("");
  }

  loadRoses();
  loadRoseColors();
  loadWrappers();
  loadAddons();
});

/* =========================
   PLACE ORDER
========================= */
function placeOrder() {
  emailjs.init("hEiylVGmo-wonXsMQ");

  // ROSES
  const rosesSelected = document.querySelector('input[name="roses"]:checked');
  const roseCount = rosesSelected ? rosesSelected.value : "N/A";

  // COLOR
  const colorSelected = document.querySelector('input[name="color"]:checked');
  const colorData = colorSelected
    ? {
        name: colorSelected.value.trim(),
        image: colorSelected.dataset.image || "",
      }
    : null;

  // WRAPPER
  const wrapperSelected = document.querySelector(
    'input[name="wrapper"]:checked',
  );
  const wrapperData = wrapperSelected
    ? {
        name: wrapperSelected.value.trim(),
        image: wrapperSelected.dataset.image || "",
      }
    : null;

  // ADD-ONS
  const addons = Array.from(
    document.querySelectorAll('input[name="addons"]:checked'),
  )
    .map((el) => el.value.trim())
    .filter(Boolean);

  // MULTICOLOR (always read)
  const multicolor = Array.from(
    document.querySelectorAll('input[name="multi-color"]:checked'),
  ).map((el) => ({
    name: el.value.trim(),
    image: el.dataset.image || "",
  }));

  // BOW (always read)
  const bowSelected = document.querySelector('input[name="bow-style"]:checked');

  const bowData = bowSelected
    ? {
        name: bowSelected.value.trim(),
        image: bowSelected.dataset.image || "",
      }
    : null;

  // CUSTOMER
  const name = document.getElementById("fullname")?.value.trim() || "";
  const email =
    document.querySelector('input[type="email"]')?.value.trim() || "";
  const phone = document.getElementById("phone")?.value.trim() || "";
  const whatsapp = document.getElementById("whatsapp")?.value.trim() || "";

  const addressRadio = document.querySelector('input[name="address"]:checked');
  const address =
    addressRadio?.value === "other"
      ? document.getElementById("customAddress")?.value.trim()
      : addressRadio?.value || "N/A";

  const total = document.getElementById("total")?.innerText || "0";

  // BUILD EMAIL ROWS
  // Images are shown as clickable links because Gmail blocks external images.
  // Other email clients will show them inline.
  let rows = "";

  const imgBlock = (url, name) =>
    url
      ? `<br/>
       <img src="${url}" width="80" height="80"
            style="margin-top:6px;border-radius:8px;border:1px solid #ddd;
                   object-fit:cover;display:block;"
            alt="${name}" />
       <a href="${url}" style="font-size:11px;color:#888;">View image</a>`
      : "";

  // 🌹 COLOR
  if (colorData?.name) {
    rows += `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
          <strong>🌹 Rose Color</strong><br/>
          ${colorData.name}
          ${imgBlock(colorData.image, colorData.name)}
        </td>
      </tr>`;
  }

  // 🎀 WRAPPER
  if (wrapperData?.name) {
    rows += `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
          <strong>🎀 Wrapper</strong><br/>
          ${wrapperData.name}
          ${imgBlock(wrapperData.image, wrapperData.name)}
        </td>
      </tr>`;
  }

  // 🎁 ADD-ONS
  if (addons.length > 0) {
    rows += `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
          <strong>🎁 Add-ons</strong><br/>
          ${addons.join(", ")}
        </td>
      </tr>`;
  }

  // =========================
  // ✨ ADDITIONALS (ALWAYS SHOW)
  // =========================
  rows += `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
      <strong>✨ Additionals</strong>
    </td>
  </tr>
`;

  // 🌈 MULTI-COLOR
  if (multicolor.length > 0) {
    const multiItems = multicolor
      .map(
        (m) => `
      <td style="text-align:center;padding:4px 8px;">
        <img src="${m.image}" width="70" height="70"
             style="border-radius:8px;border:1px solid #ddd;object-fit:cover;display:block;" />
        <span style="font-size:12px;">${m.name}</span>
      </td>`,
      )
      .join("");

    rows += `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
        <strong>🌈 Multi-color</strong><br/>
        <table><tr>${multiItems}</tr></table>
      </td>
    </tr>`;
  } else {
    rows += `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
        <strong>🌈 Multi-color</strong><br/>
        <span style="color:#888;">Not selected</span>
      </td>
    </tr>`;
  }

  // 🎀 BOW
  if (bowData?.name) {
    rows += `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
        <strong>🎀 Bow</strong><br/>
        ${bowData.name}
        ${imgBlock(bowData.image, bowData.name)}
      </td>
    </tr>`;
  } else {
    rows += `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0e6ff;">
        <strong>🎀 Bow</strong><br/>
        <span style="color:#888;">Not selected</span>
      </td>
    </tr>`;
  }
  const html =
    rows.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;">${rows}</table>`
      : `<p style="color:#999;">No additional selections.</p>`;

  const templateParams = {
    name,
    email,
    phone,
    whatsapp,
    address,
    roseCount,
    html,
    total,
  };

  emailjs
    .send("service_soduswc", "template_z1srl8q", templateParams)
    .then(async () => {
      const modal = document.getElementById("orderModal");

      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      // wait a tiny bit to ensure DOM paints
      setTimeout(() => {
        loadPaymentMethods();
      }, 50);
    })
    .catch((err) => {
      console.error("EmailJS Error:", err);
      alert("Something went wrong. Please try again.");
    });
}

window.placeOrder = placeOrder;

// LOAD PAYMENT METHODS
async function loadPaymentMethods() {
  const container = document.getElementById("paymentMethodsContainer");

  if (!container) {
    console.warn("Payment container not found");
    return;
  }

  const snap = await getDocs(collection(db, "paymentMethods"));

  if (snap.empty) {
    container.innerHTML = "<p>No payment methods available.</p>";
    return;
  }

  container.innerHTML = snap.docs
    .map((doc) => {
      const p = doc.data();

      return `
        <p>
          <strong>${p.name}</strong>: 
          <span>${p.value}</span>
        </p>
      `;
    })
    .join("");
}

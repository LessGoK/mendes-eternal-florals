import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ******************* FAQ ************************************
const questions = document.querySelectorAll(".faq-question");

questions.forEach((q) => {
  q.addEventListener("click", () => {
    const answer = q.nextElementSibling;
    answer.style.display = answer.style.display === "block" ? "none" : "block";
  });
});

// ******************* PAYMENT MODAL ************************************
const paymentLinks = document.querySelectorAll(".payment-link");
const modal = document.getElementById("paymentModal");
const closeBtn = document.getElementById("closePayment");

// open modal from ANY payment link
paymentLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "block";
  });
});

// close modal
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// close when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// go to order.html
function goToPage() {
  window.open("order.html", "_blank");
}

//****************** NAV BAR **********************************************
function observeElements() {
  const elements = document.querySelectorAll(".hidden");

  elements.forEach((el) => {
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });

    observeElements();
  });

  const hiddenElements = document.querySelectorAll(".hidden");
  hiddenElements.forEach((el) => observer.observe(el));
});

const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger?.addEventListener("click", () => navLinks.classList.toggle("open"));

document.addEventListener("DOMContentLoaded", () => {
  // Only run on mobile widths
  if (window.innerWidth <= 480) {
    const homeImage = document.querySelector(".home-image");
    const homeImageImg = document.querySelector(".home-image img");

    if (homeImage) {
      homeImage.style.transform = "none";
      homeImage.style.width = "100%";
      homeImage.style.maxWidth = "100vw";
      homeImage.style.margin = "0";
      homeImage.style.padding = "0";
    }

    if (homeImageImg) {
      homeImageImg.style.transform = "none";
      homeImageImg.style.width = "100%";
      homeImageImg.style.maxWidth = "100vw";
      homeImageImg.style.height = "auto";
      homeImageImg.style.display = "block";
      homeImageImg.style.margin = "0";
      homeImageImg.style.padding = "0";
    }
  }
});

// ********************************* DYNAMIC PRODUCTS ********************************

// Bouquets
const productsContainer = document.getElementById("productsContainer");

const colRef = collection(db, "products");

async function loadProducts() {
  productsContainer.innerHTML = "";

  const q = query(colRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  snapshot.forEach((docItem) => {
    const p = docItem.data();

    productsContainer.innerHTML += `
    <div class="card ">
      <div class="card-inner" style="--clr: #f0efeb">
        <div class="box">
          <div class="imgBox">
            <img src="${p.image}" alt="${p.name}" />
          </div>
          <div class="icon">
            <a href="order.html"  target="_blank" class="iconBox">
              <span class="material-symbols-outlined">arrow_outward</span>
            </a>
          </div>
        </div>
      </div>
      <div class="content">
        <h3>${p.name}</h3>
        <p>${p.description || ""}</p>
        <ul>
          <li style="--clr-tag: #d3b19a" class="branding">R${p.price}</li>
        </ul>
      </div>
    </div>
  `;
  });
}

loadProducts();

// Add-ons
const addonsContainer = document.getElementById("addonsContainer");
const addonsRef = collection(db, "addons");

async function loadAddons() {
  addonsContainer.innerHTML = "";

  const q = query(addonsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  snapshot.forEach((docItem) => {
    const a = docItem.data();

    addonsContainer.innerHTML += `
      <div class="card">
        <div class="card-inner" style="--clr: #f0efeb">
          <div class="box">
            <div class="imgBox">
              <img src="${a.image}" alt="${a.name}" />
            </div>
            <div class="icon">
              <a href="#"  target="_blank" class="iconBox">
                <span class="material-symbols-outlined">arrow_outward</span>
              </a>
            </div>
          </div>
        </div>
        <div class="content">
          <h3>${a.name}</h3>
          <p>${a.description || ""}</p>
          <ul>
            <li style="--clr-tag: #d3b19a" class="branding">R${a.price}</li>
          </ul>
        </div>
      </div>
    `;
  });
}

loadAddons();

// ********************************* DYNAMIC CONTACT DETAILS********************************
const contactDocRef = doc(db, "footer", "main");

const mapFrame = document.querySelector(".map iframe");
function updateMap(address) {
  const mapFrame = document.querySelector(".map iframe");

  const formatted = address.replace(/ /g, "+");
  const newSrc = `https://www.google.com/maps?q=${formatted}&output=embed`;

  mapFrame.src = "";
  setTimeout(() => {
    mapFrame.src = newSrc;
  }, 50);
}
// contacts details
async function loadContactsUI() {
  const snap = await getDoc(contactDocRef);

  if (!snap.exists()) return;

  const data = snap.data();

  // Map
  updateMap(data.address);

  // Contact us details
  document.getElementById("footer-email").innerText = data.email;
  document.getElementById("footer-phone1").innerText = data.phone1;
  document.getElementById("footer-phone2").innerText = data.phone2;
  document.getElementById("footer-address").innerHTML = `
                ${data.address}<br>
                <span>${data.province}</span>,
                <span>${data.postalCode}</span>
              `;

  //footer contact details
  document.getElementById("contact-email").innerText = data.email;
  document.getElementById("contact-phone1").innerText = data.phone1;
  document.getElementById("contact-phone2").innerText = data.phone2;
  document.getElementById("contact-address").innerText = data.address;

  // social media links
  const tiktok = document.getElementById("tiktok");
  const whatsapp = document.getElementById("whatsapp");
  const facebook = document.getElementById("facebook");
  const instagram = document.getElementById("instagram");

  if (data.tiktok) {
    tiktok.href = data.tiktok;
  }

  if (data.whatsapp) {
    whatsapp.href = data.whatsapp;
  }

  if (data.facebook) {
    facebook.href = data.facebook;
  }

  if (data.instagram) {
    instagram.href = data.instagram;
  }

  console.log("FOOTER DATA:", data);
}

loadContactsUI();

// *******************DYNAMIC PAYMENT DETAILS *************************
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
loadPaymentMethods();

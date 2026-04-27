import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const get = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  // COLLECTIONS
  const bouquetsColRef = collection(db, "products");
  const addonsColRef = collection(db, "addons");

  // INPUTS
  const bouquetInputs = {
    name: get("name-bouquet"),
    price: get("price-bouquet"),
    imageFile: get("image-bouquet-file"),
    description: get("description-bouquet"),
  };

  const addonInputs = {
    name: get("name-addon"),
    price: get("price-addon"),
    imageFile: get("image-addon-file"),
    description: get("description-addon"),
  };

  // DOM
  const bouquetsDiv = get("bouquets");
  const addonsDiv = get("addons");
  const addBouquetBtn = get("addBouquetBtn");
  const addAddonBtn = get("addAddonBtn");

  // EDIT STATE
  let editingBouquetId = null;
  let editingAddonId = null;

  // CLOUDINARY UPLOAD
  async function uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mendes-florals");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dmmoxp4ct/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      console.log("CLOUDINARY RESPONSE:", data);

      return data.secure_url;
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      return null;
    }
  }

  // SAVE FUNCTION
  async function handleSave(inputs, type, editingId, setEditingId, button) {
    try {
      const name = inputs.name.value.trim();
      const price = inputs.price.value.trim();
      const description = inputs.description.value.trim();
      const file = inputs.imageFile.files[0];

      // ✅ VALIDATION (image required on create)
      if (!name || !price || !description || (!editingId && !file)) {
        alert("Fill all fields and select an image");
        return;
      }

      let image = "";

      if (file) {
        image = await uploadImage(file);

        console.log("IMAGE URL:", image);

        if (!image) {
          alert("Image upload failed");
          return;
        }
      }

      const data = {
        name,
        price: Number(price),
        description,
        createdAt: serverTimestamp(),
      };

      if (image) data.image = image;

      const path = type === "addon" ? "addons" : "products";
      const colRef = type === "addon" ? addonsColRef : bouquetsColRef;

      if (editingId) {
        await updateDoc(doc(db, path, editingId), data);
        setEditingId(null);
        button.innerText = type === "addon" ? "Add Add-on" : "Add Bouquet";
      } else {
        await addDoc(colRef, data);
      }

      // CLEAR INPUTS
      Object.values(inputs).forEach((i) => {
        if (!i) return;
        if (i.type === "file") i.value = null;
        else i.value = "";
      });

      loadProducts();
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Something went wrong. Check console.");
    }
  }

  // BUTTON EVENTS
  addBouquetBtn?.addEventListener("click", () =>
    handleSave(
      bouquetInputs,
      "bouquet",
      editingBouquetId,
      (v) => (editingBouquetId = v),
      addBouquetBtn,
    ),
  );

  addAddonBtn?.addEventListener("click", () =>
    handleSave(
      addonInputs,
      "addon",
      editingAddonId,
      (v) => (editingAddonId = v),
      addAddonBtn,
    ),
  );

  // LOAD PRODUCTS
  async function loadProducts() {
    bouquetsDiv.innerHTML = "";
    addonsDiv.innerHTML = "";

    const bQuery = query(bouquetsColRef, orderBy("createdAt", "asc"));
    const aQuery = query(addonsColRef, orderBy("createdAt", "asc"));

    const [bSnap, aSnap] = await Promise.all([
      getDocs(bQuery),
      getDocs(aQuery),
    ]);

    bSnap.forEach((d) => renderCard(d, "bouquet"));
    aSnap.forEach((d) => renderCard(d, "addon"));
  }

  // RENDER CARD
  function renderCard(docItem, type) {
    const p = docItem.data();
    const container = type === "addon" ? addonsDiv : bouquetsDiv;

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="imgBox">
        <img src="${p.image || "https://via.placeholder.com/150"}" />
      </div>

      <div class="content">
        <h3>${p.name || ""}</h3>
        <p>${p.description || ""}</p>
        <li>R${p.price || 0}</li>

        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      </div>
    `;

    // DELETE
    div.querySelector(".deleteBtn").onclick = async () => {
      await deleteDoc(
        doc(db, type === "addon" ? "addons" : "products", docItem.id),
      );
      loadProducts();
    };

    // EDIT
    div.querySelector(".editBtn").onclick = () => {
      const inputs = type === "addon" ? addonInputs : bouquetInputs;

      if (type === "addon") {
        editingAddonId = docItem.id;
        addAddonBtn.innerText = "Update Add-on";
        get("addon-form").scrollIntoView({ behavior: "smooth" });
      } else {
        editingBouquetId = docItem.id;
        addBouquetBtn.innerText = "Update Bouquet";
        get("bouquet-form").scrollIntoView({ behavior: "smooth" });
      }

      inputs.name.value = p.name || "";
      inputs.price.value = p.price || "";
      inputs.description.value = p.description || "";
    };

    container.appendChild(div);
  }

  // INIT
  loadProducts();

  // *****************************CONTACT DETAILS *******************************
  const contactRef = doc(db, "footer", "main");

  const inputs = {
    email: get("email"),
    phone1: get("phone1"),
    phone2: get("phone2"),
    address: get("address"),
    province: get("province"),
    postalCode: get("postal"),
    facebook: get("facebook"),
    instagram: get("instagram"),
    whatsapp: get("whatsapp"),
    tiktok: get("tiktok"),
  };

  const mapFrame = document.querySelector(".map iframe");

  async function loadContacts() {
    const snap = await getDoc(contactRef);

    if (snap.exists()) {
      const data = snap.data();

      Object.keys(inputs).forEach((key) => {
        if (inputs[key]) inputs[key].value = data[key] || "";
      });

      // 🌍 MAP UPDATE (ADD THIS)
      if (data.address && mapFrame) {
        mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(
          data.address,
        )}&output=embed`;
      }
    }
  }

  function normalizeUrl(url) {
    if (!url) return "";

    url = url.trim();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    return url;
  }

  async function updateField(field) {
    let value = inputs[field].value;

    // Only fix social links
    if (["facebook", "instagram", "whatsapp", "tiktok"].includes(field)) {
      value = normalizeUrl(value);
    }

    await setDoc(contactRef, { [field]: value }, { merge: true });

    alert(`${field} updated`);
  }

  document.querySelectorAll(".contact-row button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const field = e.target.dataset.field;
      updateField(field);
    });
  });

  loadContacts();

  //**************************** order.html PAGE DYNAMIC ITEMS*********************************************

  // ROSE SIZES
  let editingRoseSizeId = null;

  get("addRoseSizeBtn")?.addEventListener("click", async () => {
    const name = get("rose-size").value.trim();
    const price = get("rose-price").value.trim();

    if (!name || !price) return alert("Fill all fields");

    const data = {
      name,
      price: Number(price),
      createdAt: serverTimestamp(),
    };

    if (editingRoseSizeId) {
      await updateDoc(doc(db, "roseOptions", editingRoseSizeId), data);
      editingRoseSizeId = null;
      get("addRoseSizeBtn").innerText = "Add Rose Size";
    } else {
      await addDoc(collection(db, "roseOptions"), data);
    }

    get("rose-size").value = "";
    get("rose-price").value = "";

    loadRoseSizes();
  });

  async function loadRoseSizes() {
    const q = query(collection(db, "roseOptions"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q); // ✅ use the query

    const container = get("rose-sizes");
    container.innerHTML = "";

    snap.forEach((d) => {
      const data = d.data();

      container.innerHTML += `
      <div class="card">
        <p>${data.name} - R${data.price}</p>

        <button onclick="editRoseSize('${d.id}', '${data.name}', '${data.price}')">Edit</button>
        <button onclick="deleteRoseSize('${d.id}')">Delete</button>
      </div>
    `;
    });
  }

  window.editRoseSize = (id, name, price) => {
    get("rose-size").value = name;
    get("rose-price").value = price;

    editingRoseSizeId = id;
    get("addRoseSizeBtn").innerText = "Update Rose Size";
  };

  window.deleteRoseSize = async (id) => {
    await deleteDoc(doc(db, "roseOptions", id));
    loadRoseSizes();
  };

  // ROSE COLORS
  let editingRoseColorId = null;

  get("addRoseColorBtn")?.addEventListener("click", async () => {
    const name = get("rose-color-name").value.trim();
    const file = get("rose-color-image").files[0];

    if (!name) return alert("Enter color name");

    let image = "";

    if (file) {
      image = await uploadImage(file);
      if (!image) return alert("Upload failed");
    }

    const data = { name };
    if (image) data.image = image;

    if (editingRoseColorId) {
      await updateDoc(doc(db, "roseColors", editingRoseColorId), data);
      editingRoseColorId = null;
      get("addRoseColorBtn").innerText = "Add Rose Color";
    } else {
      await addDoc(collection(db, "roseColors"), data);
    }

    get("rose-color-name").value = "";
    get("rose-color-image").value = "";

    loadRoseColors();
  });

  async function loadRoseColors() {
    const snap = await getDocs(collection(db, "roseColors"));
    const container = get("rose-colors");

    container.innerHTML = "";

    snap.forEach((d) => {
      const data = d.data();

      container.innerHTML += `
      <div class="card">
        <p>${data.name}</p>
        ${data.image ? `<img src="${data.image}" width="80"/>` : ""}

        <button onclick="editRoseColor('${d.id}', '${data.name}')">Edit</button>
        <button onclick="deleteRoseColor('${d.id}')">Delete</button>
      </div>
    `;
    });
  }

  window.editRoseColor = (id, name) => {
    get("rose-color-name").value = name;

    editingRoseColorId = id;
    get("addRoseColorBtn").innerText = "Update Rose Color";
  };

  window.deleteRoseColor = async (id) => {
    await deleteDoc(doc(db, "roseColors", id));
    loadRoseColors();
  };

  //  WRAPPER COLORS
  let editingWrapperId = null;

  get("addWrapperBtn")?.addEventListener("click", async () => {
    const name = get("wrapper-name").value.trim();
    const file = get("wrapper-image").files[0];

    if (!name) return alert("Enter wrapper name");

    let image = "";

    if (file) {
      image = await uploadImage(file);
      if (!image) return alert("Upload failed");
    }

    const data = { name };
    if (image) data.image = image;

    if (editingWrapperId) {
      await updateDoc(doc(db, "wrapperColors", editingWrapperId), data);
      editingWrapperId = null;
      get("addWrapperBtn").innerText = "Add Wrapper";
    } else {
      await addDoc(collection(db, "wrapperColors"), data);
    }

    get("wrapper-name").value = "";
    get("wrapper-image").value = "";

    loadWrappers();
  });

  async function loadWrappers() {
    const snap = await getDocs(collection(db, "wrapperColors"));
    const container = get("wrappers");

    container.innerHTML = "";

    snap.forEach((d) => {
      const data = d.data();

      container.innerHTML += `
      <div class="card">
        <p>${data.name}</p>
        ${data.image ? `<img src="${data.image}" width="80"/>` : ""}

        <button onclick="editWrapper('${d.id}', '${data.name}')">Edit</button>
        <button onclick="deleteWrapper('${d.id}')">Delete</button>
      </div>
    `;
    });
  }

  window.editWrapper = (id, name) => {
    get("wrapper-name").value = name;

    editingWrapperId = id;
    get("addWrapperBtn").innerText = "Update Wrapper";
  };

  window.deleteWrapper = async (id) => {
    await deleteDoc(doc(db, "wrapperColors", id));
    loadWrappers();
  };

  // FINAL INIT

  loadRoseSizes();
  loadRoseColors();
  loadWrappers();

  // PAYMENT METHODS
  const paymentList = get("payment-list");
  const paymentName = get("payment-name");
  const paymentValue = get("payment-value");
  const addPaymentBtn = get("addPaymentBtn");

  let editingPaymentId = null;

  async function loadPayments() {
    const snap = await getDocs(collection(db, "paymentMethods"));
    paymentList.innerHTML = "";

    snap.forEach((d) => {
      const p = d.data();

      paymentList.innerHTML += `
      <div class="card">
        <div class="card-inner">
          <p><strong>${p.name}</strong></p>
          <p>${p.value}</p>

          <button onclick="editPayment('${d.id}', '${p.name}', '${p.value}')">
            Edit
          </button>

          <button onclick="deletePayment('${d.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
    });
  }

  addPaymentBtn?.addEventListener("click", async () => {
    const name = paymentName.value.trim();
    const value = paymentValue.value.trim();

    if (!name || !value) {
      alert("Fill all fields");
      return;
    }

    const data = { name, value };

    if (editingPaymentId) {
      await updateDoc(doc(db, "paymentMethods", editingPaymentId), data);
      editingPaymentId = null;
      addPaymentBtn.innerText = "Add Payment Method";
    } else {
      await addDoc(collection(db, "paymentMethods"), data);
    }

    paymentName.value = "";
    paymentValue.value = "";

    loadPayments();
  });

  window.editPayment = (id, name, value) => {
    paymentName.value = name;
    paymentValue.value = value;

    editingPaymentId = id;
    get("addPaymentBtn").innerText = "Update Payment Method";
  };

  window.deletePayment = async (id) => {
    await deleteDoc(doc(db, "paymentMethods", id));
    loadPayments();
  };

  // AUTH CONTROL
  const auth = getAuth();
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadProducts(); //  only runs when logged in
    } else {
      window.location.href = "admin-login.html";
    }
  });

  // LOGOUT
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
});

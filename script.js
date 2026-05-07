const API = {
  createMedia: "https://prod-29.spaincentral.logic.azure.com:443/workflows/a7347fe6aa2e4f37a6f4f1a9fa3c7028/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=a7ySfkV0xislZ9LnrwTw9UUdKimyu7iFQxVKf-Gj-uU",

  getMedia: "https://prod-30.spaincentral.logic.azure.com:443/workflows/de079db09c5640bd886a15c7012bbf99/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=QFomOsthQdwWF5fLq3z624IKOdf8FBj2MQC9VTximDI",

  updateMedia: "https://prod-24.spaincentral.logic.azure.com:443/workflows/409c01972c9142cbaa09c94612c16199/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=Cy3jBRF9oZN8FaOao4oORJ62nY7IQVZ-9S50IRz-cxM",

  deleteMedia: "https://prod-21.spaincentral.logic.azure.com:443/workflows/01844f07b09c4beeb8ebc833ed4e28f9/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=kc30AKrT0CJF6C_LQ2axH9zCRaBVsf_jg4tFFtLtZGU"

};

const mediaForm = document.getElementById("mediaForm");
const mediaList = document.getElementById("mediaList");
const statusMessage = document.getElementById("statusMessage");
const refreshBtn = document.getElementById("refreshBtn");

let mediaItems = [];

mediaForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const fileInput = document.getElementById("mediaFile");
  const file = fileInput.files[0];

  if (!file) {
    showStatus("Please select a file.", "error");
    return;
  }

  try {
    showStatus("Uploading media...", "info");

    const base64File = await convertFileToBase64(file);

    const payload = {
      title,
      description,
      category,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileContent: base64File
    };

    const response = await fetch(API.createMedia, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    mediaForm.reset();
    showStatus("Media uploaded successfully.", "success");
    await loadMediaItems();
  } catch (error) {
    console.error(error);
    showStatus("Upload failed. Check console or Logic App run history.", "error");
  }
});

refreshBtn.addEventListener("click", loadMediaItems);

async function loadMediaItems() {
  try {
    mediaList.innerHTML = "<p>Loading media...</p>";

    const response = await fetch(API.getMedia);

    if (!response.ok) {
      throw new Error("Could not load media records");
    }

    const data = await response.json();
    mediaItems = normaliseMediaResponse(data);

    renderMediaItems();
  } catch (error) {
    console.error(error);
    mediaList.innerHTML = "<p>Could not load media items.</p>";
  }
}

function normaliseMediaResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.documents)) return data.documents;
  if (Array.isArray(data.Documents)) return data.Documents;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function renderMediaItems() {
  if (!mediaItems.length) {
    mediaList.innerHTML = "<p>No media items found.</p>";
    return;
  }

  mediaList.innerHTML = mediaItems.map(item => `
    <article class="media-card">
      <div class="preview">
        ${renderPreview(item)}
      </div>

      <div class="card-body">
        <h3>${escapeHtml(item.title || "Untitled")}</h3>
        <p>${escapeHtml(item.description || "")}</p>
        <p class="meta">Category: ${escapeHtml(item.category || "N/A")}</p>
        <p class="meta">File: ${escapeHtml(item.fileName || "N/A")}</p>

        <div class="actions">
          <a class="btn secondary" href="${item.fileUrl}" target="_blank">Open</a>
          <button class="btn edit" onclick="editMedia('${item.id}')">Edit</button>
          <button class="btn danger" onclick="deleteMedia('${item.id}')">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderPreview(item) {
  const fileUrl = item.fileUrl || "";
  const contentType = item.contentType || "";

  if (contentType.startsWith("image/")) {
    return `<img src="${fileUrl}" alt="${escapeHtml(item.title || "media image")}" />`;
  }

  if (contentType.startsWith("video/")) {
    return `<video src="${fileUrl}" controls></video>`;
  }

  return `<div class="file-placeholder">📄</div>`;
}

async function editMedia(id) {
  const item = mediaItems.find(media => media.id === id);

  if (!item) {
    alert("Media item not found.");
    return;
  }

  const newTitle = prompt("Update title:", item.title || "");
  if (newTitle === null) return;

  const newDescription = prompt("Update description:", item.description || "");
  if (newDescription === null) return;

  const newCategory = prompt("Update category:", item.category || "");
  if (newCategory === null) return;

  const payload = {
    id: item.id,
    title: newTitle.trim(),
    description: newDescription.trim(),
    category: newCategory.trim(),
    fileName: item.fileName,
    blobName: item.blobName,
    fileUrl: item.fileUrl,
    contentType: item.contentType,
    createdAt: item.createdAt
  };

  try {
    const response = await fetch(API.updateMedia, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    showStatus("Media item updated successfully.", "success");
    await loadMediaItems();
  } catch (error) {
    console.error(error);
    showStatus("Update failed. Check Logic App run history.", "error");
  }
}

async function deleteMedia(id) {
  const item = mediaItems.find(media => media.id === id);

  if (!item) {
    alert("Media item not found.");
    return;
  }

  const confirmed = confirm(`Delete "${item.title}"?`);

  if (!confirmed) return;

  const payload = {
    id: item.id,
    blobName: item.blobName
  };

  try {
    const response = await fetch(API.deleteMedia, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    showStatus("Media item deleted successfully.", "success");
    await loadMediaItems();
  } catch (error) {
    console.error(error);
    showStatus("Delete failed. Check Logic App run history.", "error");
  }
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showStatus(message, type) {
  statusMessage.textContent = message;

  if (type === "success") {
    statusMessage.style.color = "#15803d";
  } else if (type === "error") {
    statusMessage.style.color = "#dc2626";
  } else {
    statusMessage.style.color = "#2563eb";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadMediaItems();
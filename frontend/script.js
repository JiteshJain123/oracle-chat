const input = document.querySelector("#input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask");
const attachBtn = document.querySelector("#attach-btn");
const fileInput = document.querySelector("#file-input");
const filePreview = document.querySelector("#file-preview");

const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
let isLoading = false;
let selectedFile = null;

input?.addEventListener("keydown", handleEnter);
askBtn?.addEventListener("click", handleAsk);
attachBtn?.addEventListener("click", () => fileInput?.click());

// "Analyze a File" suggestion card opens file picker directly
document.getElementById("upload-hint-btn")?.addEventListener("click", () => {
    fileInput?.click();
});

// Regular suggestion cards
document.querySelectorAll(".suggestion:not(#upload-hint-btn)").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!isLoading) {
            input.value = btn.dataset.prompt || "";
            handleAsk();
        }
    });
});

// File selection
fileInput?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5 MB.");
        fileInput.value = "";
        return;
    }

    selectedFile = file;
    renderFilePreview(file);
    input.focus();
});

// Auto-resize textarea
input?.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 128) + "px";
});

function pdfIcon(color = "text-red-400") {
    return `<svg class="w-4 h-4 ${color} flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`;
}

function renderFilePreview(file) {
    filePreview.innerHTML = "";

    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = e => {
            filePreview.innerHTML = `
              <div class="relative inline-flex">
                <img src="${e.target.result}" class="h-14 w-14 object-cover rounded-xl border border-white/10" />
                <button id="remove-file" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-700 hover:bg-neutral-600 border border-white/10 rounded-full flex items-center justify-center text-xs transition-colors leading-none">×</button>
              </div>
            `;
            showPreviewBar();
            document.getElementById("remove-file")?.addEventListener("click", clearFile);
        };
        reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
        filePreview.innerHTML = `
          <div class="flex items-center gap-2 bg-neutral-800 border border-white/5 rounded-xl px-3 py-2">
            ${pdfIcon()}
            <span class="text-xs text-neutral-300 max-w-xs truncate">${escapeHtml(file.name)}</span>
            <button id="remove-file" class="ml-1 w-5 h-5 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center text-xs transition-colors flex-shrink-0 leading-none">×</button>
          </div>
        `;
        showPreviewBar();
        document.getElementById("remove-file")?.addEventListener("click", clearFile);
    }
}

function showPreviewBar() {
    filePreview.classList.remove("hidden");
    filePreview.classList.add("flex");
}

function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    filePreview.innerHTML = "";
    filePreview.classList.add("hidden");
    filePreview.classList.remove("flex");
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function botIcon() {
    return `<svg class="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2"/>
      <path d="M9 12v1.5M15 12v1.5M9.5 17h5M12 8V5.5"/>
      <circle cx="12" cy="4.5" r="1" fill="currentColor" stroke="none"/>
    </svg>`;
}

const loading = document.createElement("div");
loading.className = "flex items-start gap-3 my-5";
loading.innerHTML = `
  <div class="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
    ${botIcon()}
  </div>
  <div class="flex gap-1 items-center pt-2.5">
    <span class="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style="animation-delay:0ms"></span>
    <span class="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style="animation-delay:150ms"></span>
    <span class="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style="animation-delay:300ms"></span>
  </div>
`;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function generate(message) {
    document.getElementById("welcome")?.remove();

    isLoading = true;
    if (askBtn) askBtn.disabled = true;

    const file = selectedFile;
    clearFile();

    // Build attachment preview inside user bubble
    let attachmentHtml = "";
    if (file?.type.startsWith("image/")) {
        const dataUrl = await readFileAsDataUrl(file);
        attachmentHtml = `<img src="${dataUrl}" class="mb-2 max-h-48 rounded-xl object-cover w-full" />`;
    } else if (file?.type === "application/pdf") {
        attachmentHtml = `
          <div class="flex items-center gap-1.5 mb-2 text-xs text-neutral-400">
            ${pdfIcon("text-red-400")}
            <span class="truncate max-w-xs">${escapeHtml(file.name)}</span>
          </div>
        `;
    }

    const userMsg = document.createElement("div");
    userMsg.className = "flex justify-end my-5";
    userMsg.innerHTML = `
      <div class="bg-neutral-800 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[78%] text-sm leading-relaxed">
        ${attachmentHtml}
        ${message ? `<span class="whitespace-pre-wrap">${escapeHtml(message)}</span>` : ""}
      </div>
    `;
    chatContainer?.appendChild(userMsg);
    input.value = "";
    input.style.height = "auto";

    chatContainer?.appendChild(loading);
    scrollToBottom();

    try {
        const assistantMessage = await CallServer(message, file);
        loading.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "flex items-start gap-3 my-5";
        aiMsg.innerHTML = `
          <div class="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            ${botIcon()}
          </div>
          <div class="text-neutral-100 text-sm leading-relaxed max-w-[80%] pt-1 whitespace-pre-wrap">${escapeHtml(assistantMessage)}</div>
        `;
        chatContainer?.appendChild(aiMsg);

    } catch (error) {
        console.error(error);
        loading.remove();

        const errMsg = document.createElement("div");
        errMsg.className = "flex items-start gap-3 my-5";
        errMsg.innerHTML = `
          <div class="w-7 h-7 bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-red-400 font-bold">!</div>
          <div class="text-red-400 text-sm pt-1">Failed to get a response. Please check the server and try again.</div>
        `;
        chatContainer?.appendChild(errMsg);
    }

    isLoading = false;
    if (askBtn) askBtn.disabled = false;
    scrollToBottom();
    input.focus();
}

async function CallServer(inputText, file = null) {
    if (file) {
        const formData = new FormData();
        formData.append("message", inputText || "");
        formData.append("threadId", threadId);
        formData.append("file", file);

        const response = await fetch("http://localhost:3001/chat", {
            method: "POST",
            body: formData, // browser sets Content-Type multipart/form-data with boundary
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return result.message;
    }

    const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: inputText }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.message;
}

async function handleAsk() {
    const message = input.value.trim();
    if (!message && !selectedFile) return;
    if (isLoading) return;
    await generate(message);
}

async function handleEnter(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const message = input.value.trim();
        if (!message && !selectedFile) return;
        if (isLoading) return;
        await generate(message);
    }
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

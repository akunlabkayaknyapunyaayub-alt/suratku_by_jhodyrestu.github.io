
const fields = [
    "nama",
    "email",
    "telepon",
    "alamat",
    "pendidikan",
    "perusahaan",
    "posisi",
    "sumber",
    "keahlian",
    "motivasi"
];

const previewMap = {
    nama: "previewNama",
    email: "previewEmail",
    telepon: "previewTelepon",
    alamat: "previewAlamat",
    pendidikan: "previewPendidikan",
    perusahaan: "previewPerusahaan",
    posisi: "previewPosisi",
    sumber: "previewSumber",
    keahlian: "previewKeahlian",
    motivasi: "previewMotivasi"
};

const form = document.getElementById("applicationForm");
const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let hasSignature = false;
let cvUrl = null;

function updatePreview() {
    fields.forEach((field) => {
        const input = document.getElementById(field);
        const preview = document.getElementById(previewMap[field]);

        if (input && preview) {
            const fallback = field === "sumber"
                ? "informasi lowongan"
                : field === "motivasi"
                    ? "Saya tertarik untuk bergabung dan berkembang bersama perusahaan."
                    : "-";

            preview.textContent = input.value.trim() || fallback;
        }
    });

    document.getElementById("previewNamaTtd").textContent =
        document.getElementById("nama").value.trim() || "Nama Lengkap";
}

fields.forEach((field) => {
    document.getElementById(field).addEventListener("input", updatePreview);
});

function updateDate() {
    const today = new Date();

    document.getElementById("previewDate").textContent =
        "Jakarta, " + today.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

updateDate();
updatePreview();

// Upload dan preview CV
document.getElementById("cv").addEventListener("change", function () {
    const file = this.files[0];
    const info = document.getElementById("fileInfo");
    const preview = document.getElementById("cvPreview");

    preview.innerHTML = "";

    if (cvUrl) {
        URL.revokeObjectURL(cvUrl);
        cvUrl = null;
    }

    if (!file) {
        info.textContent = "Belum ada file dipilih.";
        return;
    }

    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedExtensions.test(file.name)) {
        alert("Format file harus PDF, DOC, atau DOCX.");
        this.value = "";
        info.textContent = "Format file tidak valid.";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran CV maksimal 5 MB.");
        this.value = "";
        info.textContent = "Ukuran file terlalu besar.";
        return;
    }

    info.textContent =
        `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

    if (file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")) {
        cvUrl = URL.createObjectURL(file);

        const iframe = document.createElement("iframe");
        iframe.src = cvUrl;
        iframe.title = "Preview CV PDF";

        preview.appendChild(iframe);
    }
});

// Tanda tangan: mendukung mouse dan layar sentuh
function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height
    };
}

canvas.addEventListener("pointerdown", function (event) {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);

    const pos = getPointerPosition(event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("pointermove", function (event) {
    if (!drawing) return;

    const pos = getPointerPosition(event);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#163d2b";

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    hasSignature = true;
});

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("pointerleave", function () {
    // Drawing tetap berlanjut selama pointer masih ditekan.
});

// Terapkan tanda tangan ke surat
function applySignature() {
    const image = document.getElementById("signatureImage");

    if (hasSignature) {
        image.src = canvas.toDataURL("image/png");
        image.hidden = false;
    } else {
        image.removeAttribute("src");
        image.hidden = true;
    }
}

canvas.addEventListener("pointerup", applySignature);

// Hapus tanda tangan
document.getElementById("clearSignature").addEventListener("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
    applySignature();
});

// Cetak atau simpan surat sebagai PDF
document.getElementById("printBtn").addEventListener("click", function () {
    updatePreview();
    applySignature();
    window.print();
});

// Salin isi surat
document.getElementById("copyBtn").addEventListener("click", async function () {
    const letter = document.getElementById("letterPreview");
    const text = letter.innerText;

    try {
        await navigator.clipboard.writeText(text);
        alert("Surat lamaran berhasil disalin!");
    } catch (error) {
        const range = document.createRange();
        range.selectNodeContents(letter);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        alert("Pilih teks surat, lalu salin dengan Ctrl+C.");
    }
});

// Reset formulir
document.getElementById("resetBtn").addEventListener("click", function () {
    const confirmed = confirm("Yakin ingin menghapus semua data formulir?");

    if (!confirmed) return;

    form.reset();

    document.getElementById("fileInfo").textContent =
        "Belum ada file dipilih.";

    document.getElementById("cvPreview").innerHTML = "";

    if (cvUrl) {
        URL.revokeObjectURL(cvUrl);
        cvUrl = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;

    applySignature();
    updatePreview();
    updateDate();
});

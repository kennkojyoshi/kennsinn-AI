// script.js  — index.html（fileInput / uploadBtn / preview / commentInput）に対応

// ---- Firebase (あなたのプロジェクト値) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ★ここはあなたのコンソールの値。今のプロジェクトの設定を入れてあります
const firebaseConfig = {
  apiKey: "QBJ78e2NKlSRTELJLbh2SmALxll2",
  authDomain: "gazo-upload-e4201.firebaseapp.com",
  projectId: "gazo-upload-e4201",
  storageBucket: "gazo-upload-e4201.appspot.com",
  messagingSenderId: "1077188830783",
  appId: "1:1077188830783:web:4d4356de2b301eec957a8a",
  measurementId: "G-3R3LT0LXE7"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ---- DOM参照 ----
const fileInput     = document.getElementById("fileInput");
const uploadBtn     = document.getElementById("uploadBtn");
const previewImg    = document.getElementById("preview");
const commentInput  = document.getElementById("commentInput");
const saveCommentBtn= document.getElementById("saveCommentBtn"); // ※今回は未使用
const galleryDiv    = document.getElementById("gallery");

// ---- 画像プレビュー ----
let selectedFile = null;
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0] || null;
  selectedFile = f;
  if (!f) {
    previewImg.removeAttribute("src");
    return;
  }
  if (!f.type.startsWith("image/")) {
    alert("画像ファイルを選択してください");
    fileInput.value = "";
    selectedFile = null;
    return;
  }
  // プレビュー表示
  const url = URL.createObjectURL(f);
  previewImg.src = url;
});

// ---- Firestoreへアップロード（Base64で保存） ----
uploadBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("画像を選択してください");
    return;
  }
  try {
    // 画像をBase64に変換
    const base64 = await fileToBase64(selectedFile);

    // Firestoreに保存（画像とコメントを同じドキュメントに）
    await addDoc(collection(db, "gallery"), {
      imageData: base64,
      comment: (commentInput?.value || "").trim(),
      createdAt: serverTimestamp()
    });

    alert("アップロード完了！");
    // 入力リセット
    fileInput.value = "";
    previewImg.removeAttribute("src");
    if (commentInput) commentInput.value = "";
    selectedFile = null;

    // リスト再読み込み
    await loadGallery();
  } catch (e) {
    alert("アップロードに失敗: " + e.message);
    console.error(e);
  }
});

// File -> Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- ギャラリー表示 ----
async function loadGallery() {
  galleryDiv.innerHTML = "";
  const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    galleryDiv.innerHTML = '<p class="muted">まだ投稿がありません</p>';
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const wrap = document.createElement("div");
    wrap.className = "card photo";
    const created =
      d.createdAt?.toDate?.()?.toLocaleString?.() || "";

    wrap.innerHTML = `
      <div>
        <img src="${d.imageData}" style="max-width:100%;border-radius:12px" alt="uploaded">
      </div>
      <div>
        <div class="muted">投稿日: ${created}</div>
        <div class="comment">${escapeHtml(d.comment || "")}</div>
      </div>
    `;
    galleryDiv.appendChild(wrap);
  });
}

// XSS対策の簡易エスケープ
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[s]));
}

// 初回読み込み
loadGallery();

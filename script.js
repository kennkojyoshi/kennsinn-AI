// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase設定（index.htmlと同じものにしてください）
const firebaseConfig = {
  apiKey: "あなたのAPIキー",
  authDomain: "gazo-upload-e4201.firebaseapp.com",
  projectId: "gazo-upload-e4201",
  storageBucket: "gazo-upload-e4201.appspot.com",
  messagingSenderId: "1077188830783",
  appId: "1:1077188830783:web:4d4356de2b301eec957a8a",
  measurementId: "G-3R3LT0LXE7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ====== ログイン関連 ======
document.getElementById("adminLogin")?.addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("管理者ログイン成功！");
    loadGallery(true);
  } catch (err) {
    alert("ログイン失敗: " + err.message);
  }
});

document.getElementById("guestLogin")?.addEventListener("click", async () => {
  try {
    await signInAnonymously(auth);
    alert("ゲストログイン成功！");
    loadGallery(false);
  } catch (err) {
    alert("ログイン失敗: " + err.message);
  }
});

// ====== Firestoreへ投稿 ======
document.getElementById("uploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("imageFile").files[0];
  const comment = document.getElementById("comment").value;

  if (!file) {
    alert("画像を選んでください");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result;
    await addDoc(collection(db, "gallery"), {
      image: base64,
      comment: comment,
      createdAt: new Date()
    });
    alert("アップロード成功！");
    loadGallery(auth.currentUser?.email !== null); 
  };
  reader.readAsDataURL(file);
});

// ====== Firestoreからギャラリー取得 ======
async function loadGallery(isAdmin) {
  const galleryDiv = document.getElementById("gallery");
  galleryDiv.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "gallery"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const item = document.createElement("div");
    item.className = "gallery-item";

    item.innerHTML = `
      <img src="${data.image}" alt="uploaded">
      <div class="comment">${data.comment || ""}</div>
    `;

    // 管理者だけ削除ボタンを表示
    if (isAdmin) {
      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.className = "admin-controls";
      btn.onclick = async () => {
        await deleteDoc(doc(db, "gallery", docSnap.id));
        alert("削除しました");
        loadGallery(true);
      };
      item.appendChild(btn);
    }

    galleryDiv.appendChild(item);
  });
}

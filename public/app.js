const api = {
  async get(path) {
    const res = await fetch(path);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  async post(path, body, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth && localStorage.getItem("token")) headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || (data.errors && data.errors.join(", ")) || "Request failed");
    return data;
  },
};

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function byId(id) {
  return document.getElementById(id);
}

function ratingText(item) {
  return item.average_rating ? `⭐ ${item.average_rating}` : "No ratings yet";
}

function renderComments(container, comments) {
  container.innerHTML = comments
    .map(
      (comment) => `<div class="comment"><strong>${comment.username}</strong><p>${comment.content}</p><small class="muted">${new Date(
        comment.created_at
      ).toLocaleString()}</small></div>`
    )
    .join("");
}

window.museumApp = { api, getParam, byId, ratingText, renderComments };

(() => {
  const IMAGE_NOT_FOUND_URL = "/images/image-not-found.svg";

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
    async del(path, auth = false) {
      const headers = {};
      if (auth && localStorage.getItem("token")) headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
      const res = await fetch(path, { method: "DELETE", headers });
      const data = res.status === 204 ? null : await res.json();
      if (!res.ok) throw new Error((data && data.error) || (data && data.errors && data.errors.join(", ")) || "Request failed");
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function safeImageUrl(value) {
    try {
      const parsed = new URL(value, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
      return null;
    } catch {
      return null;
    }
  }

  function splitImageUrlList(value) {
    if (typeof value !== "string") return [];
    const normalized = value.replace(/\r\n?/g, "\n").trim();
    if (!normalized) return [];
    return normalized
      .split(/,\s*(?=https?:\/\/)|\n+/i)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function normalizeImageUrl(value) {
    const initial = safeImageUrl(value);
    if (!initial) return null;

    try {
      const parsed = new URL(initial);

      if (parsed.hostname === "external-content.duckduckgo.com" && parsed.pathname === "/iu/") {
        const nestedUrl = parsed.searchParams.get("u");
        const decodedUrl = nestedUrl ? safeImageUrl(decodeURIComponent(nestedUrl)) : null;
        if (decodedUrl) return decodedUrl;
      }

      if (
        parsed.hostname === "collectionapi.metmuseum.org" &&
        parsed.pathname.includes("/iiif/") &&
        /\/main-image\/?$/i.test(parsed.pathname)
      ) {
        parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/full/1200,/0/default.jpg`;
        parsed.search = "";
        return parsed.href;
      }

      return parsed.href;
    } catch {
      return initial;
    }
  }

  function handleImageError(event) {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.fallbackApplied === "1") return;
    image.dataset.fallbackApplied = "1";
    const slide = image.closest(".slide");
    if (slide) slide.classList.add("image-fallback");
    image.src = IMAGE_NOT_FOUND_URL;
  }

  function imageUrls(value, fallbackSeed) {
    const urls = splitImageUrlList(value)
      .map((entry) => normalizeImageUrl(entry))
      .filter(Boolean);
    if (urls.length) return urls;
    return [IMAGE_NOT_FOUND_URL];
  }

  function renderSlideshow(urls, altText) {
    const escapedAltText = escapeHtml(altText);
    const slides = urls
      .map(
        (url, index) =>
          `<figure class="slide${index === 0 ? " active" : ""}">
             <img src="${url}" alt="${escapedAltText}" loading="lazy" referrerpolicy="no-referrer" onerror="window.museumApp.handleImageError(event)" />
             <figcaption class="slide-fallback-label">Image unavailable</figcaption>
           </figure>`
      )
      .join("");
    const controls =
      urls.length > 1
        ? `<button type="button" class="slide-btn prev" data-slide-direction="-1">‹</button>
           <button type="button" class="slide-btn next" data-slide-direction="1">›</button>`
        : "";
    return `<div class="slideshow">${slides}${controls}</div>`;
  }

  function initSlideshows(root = document) {
    root.querySelectorAll(".slideshow").forEach((slideshow) => {
      if (slideshow.dataset.initialized === "1") return;
      slideshow.dataset.initialized = "1";
      const slides = [...slideshow.querySelectorAll(".slide")];
      if (slides.length <= 1) return;

      let index = 0;
      const setActive = () => {
        slides.forEach((slide, current) => {
          slide.classList.toggle("active", current === index);
        });
      };

      slideshow.querySelectorAll("[data-slide-direction]").forEach((button) => {
        button.addEventListener("click", () => {
          const direction = Number(button.dataset.slideDirection);
          index = (index + direction + slides.length) % slides.length;
          setActive();
        });
      });
    });
  }

  window.museumApp = {
    api,
    getParam,
    byId,
    ratingText,
    renderComments,
    imageUrls,
    renderSlideshow,
    initSlideshows,
    handleImageError,
  };
})();

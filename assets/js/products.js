'use strict';

const PRODUCT_ASSET_ROOT = 'assets/images/products/';
const PRODUCT_MANIFEST = `${PRODUCT_ASSET_ROOT}products-manifest.json`;
const productCatalog = [
  {id:'p1-5',name:'P1.5 LED Display',pitch:'1.5 mm',split:true},
  {id:'p2',name:'P2 LED Display',pitch:'2 mm',split:true},
  {id:'p2-5',name:'P2.5 LED Display',pitch:'2.5 mm',split:true},
  {id:'p3',name:'P3 LED Display',pitch:'3 mm',split:true},
  {id:'p4',name:'P4 LED Display',pitch:'4 mm',split:true},
  {id:'p5',name:'P5 LED Display',pitch:'5 mm'},
  {id:'p6',name:'P6 LED Display',pitch:'6 mm'},
  {id:'restaurant-cafe-displays',key:'restaurantCafeDisplays'},
  {id:'commercial-advertising-displays',key:'commercialAdvertisingDisplays',split:true}
];

const productGrid = document.querySelector('[data-product-gallery-grid]');
let productManifestPromise;

function words() {
  return translations[currentLanguage] || translations.en;
}

function productName(product) {
  return product.key ? (words()[product.key] || product.id) : product.name;
}

function imageUrl(path) {
  return `${PRODUCT_ASSET_ROOT}${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function loadProductManifest() {
  if (!productManifestPromise) {
    productManifestPromise = fetch(PRODUCT_MANIFEST, {cache:'no-cache'}).then(response => {
      if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
      return response.json();
    });
  }
  return productManifestPromise;
}

async function getProductImages(categoryId, environment) {
  const manifest = await loadProductManifest();
  const data = manifest.products?.[categoryId] || {};
  return environment ? (data[environment] || []) : (data.images || []);
}

function updateGalleryButtons(gallery) {
  const track = gallery.querySelector('.product-gallery-track');
  const previous = gallery.querySelector('[data-gallery-previous]');
  const next = gallery.querySelector('[data-gallery-next]');
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  previous.disabled = track.scrollLeft <= 1;
  next.disabled = track.scrollLeft >= maxScroll - 1;
}

function galleryMarkup(product, paths) {
  if (!paths.length) {
    return `<div class="product-gallery-empty" role="status" data-i18n="images_coming_soon">${words().images_coming_soon}</div>`;
  }
  const name = productName(product);
  const slides = paths.map((path, index) =>
    `<div class="product-gallery-slide"><img src="${imageUrl(path)}" alt="${name} — ${index + 1}" loading="lazy" decoding="async"></div>`
  ).join('');
  return `<div class="product-gallery" data-gallery>
    <div class="product-gallery-track" tabindex="0">${slides}</div>
    <button class="gallery-arrow gallery-previous" type="button" data-gallery-previous aria-label="${words().previous_image}">‹</button>
    <button class="gallery-arrow gallery-next" type="button" data-gallery-next aria-label="${words().next_image}">›</button>
  </div>`;
}

function selectedEnvironment(data) {
  if (data.indoor?.length) return 'indoor';
  if (data.outdoor?.length) return 'outdoor';
  return 'indoor';
}

function cardMarkup(product, data) {
  const environment = product.split ? selectedEnvironment(data) : null;
  const paths = product.split ? (data[environment] || []) : (data.images || []);
  const selector = product.split ? `<div class="environment-selector" role="group" aria-label="${productName(product)}">
    ${['indoor','outdoor'].map(type => {
      const available = Boolean(data[type]?.length);
      return `<button type="button" data-environment="${type}" data-i18n="${type}" aria-pressed="${type === environment}" ${available ? '' : 'disabled'}>${words()[type]}</button>`;
    }).join('')}
  </div>` : '';
  return `<article class="product-card product-gallery-card visible" id="${product.id}" data-product-id="${product.id}">
    <div data-gallery-slot>${galleryMarkup(product, paths)}</div>
    <div class="card-body">
      <div class="card-top"><span class="tag" data-i18n="products_label">${words().products_label}</span>${product.pitch ? `<small>${product.pitch}</small>` : ''}</div>
      <h3${product.key ? ` data-i18n="${product.key}"` : ''}>${productName(product)}</h3>
      ${selector}
    </div>
  </article>`;
}

function wireGallery(gallery) {
  const track = gallery.querySelector('.product-gallery-track');
  const amount = () => Math.max(track.clientWidth * .85, 240);
  gallery.querySelector('[data-gallery-previous]').addEventListener('click', () => {
    track.scrollBy({left:-amount(),behavior:'smooth'});
  });
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => {
    track.scrollBy({left:amount(),behavior:'smooth'});
  });
  track.addEventListener('scroll', () => updateGalleryButtons(gallery), {passive:true});
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    track.scrollBy({left:event.key === 'ArrowLeft' ? -amount() : amount(),behavior:'smooth'});
  });
  gallery.querySelectorAll('img').forEach(image => {
    const show = () => image.classList.add('is-loaded');
    const remove = () => {
      image.closest('.product-gallery-slide')?.remove();
      if (!track.children.length) {
        gallery.outerHTML = `<div class="product-gallery-empty" role="status" data-i18n="images_coming_soon">${words().images_coming_soon}</div>`;
        return;
      }
      updateGalleryButtons(gallery);
    };
    image.addEventListener('load', show, {once:true});
    image.addEventListener('error', remove, {once:true});
    if (image.complete) image.naturalWidth ? show() : remove();
  });
  requestAnimationFrame(() => updateGalleryButtons(gallery));
}

function wireCard(card, product, data) {
  card.querySelectorAll('[data-environment]').forEach(button => button.addEventListener('click', () => {
    if (button.disabled || button.getAttribute('aria-pressed') === 'true') return;
    card.querySelectorAll('[data-environment]').forEach(option =>
      option.setAttribute('aria-pressed', String(option === button))
    );
    card.querySelector('[data-gallery-slot]').innerHTML = galleryMarkup(product, data[button.dataset.environment] || []);
    const gallery = card.querySelector('[data-gallery]');
    if (gallery) wireGallery(gallery);
  }));
  const gallery = card.querySelector('[data-gallery]');
  if (gallery) wireGallery(gallery);
}

function updateDynamicLabels() {
  document.querySelectorAll('[data-gallery-previous]').forEach(button => button.setAttribute('aria-label', words().previous_image));
  document.querySelectorAll('[data-gallery-next]').forEach(button => button.setAttribute('aria-label', words().next_image));
  productCatalog.forEach(product => {
    document.querySelectorAll(`#${product.id} .product-gallery-slide img`).forEach((image, index) =>
      image.setAttribute('alt', `${productName(product)} — ${index + 1}`)
    );
  });
}

async function initializeSamplesCarousel() {
  const carousel = document.querySelector('[data-samples-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-samples-track]');
  const state = carousel.querySelector('[data-samples-state]');
  const previous = carousel.querySelector('[data-samples-previous]');
  const next = carousel.querySelector('[data-samples-next]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let hovered = false;
  let focused = false;
  let dragging = false;

  const slides = () => [...track.querySelectorAll('.samples-slide')];
  const step = () => {
    const first = slides()[0];
    if (!first) return track.clientWidth;
    return first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
  };
  const move = direction => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const target = track.scrollLeft + step() * direction;
    track.scrollTo({
      left: direction > 0 && target >= maxScroll - 1 ? 0 : direction < 0 && target <= 1 ? maxScroll : target,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };
  const start = () => {
    stop();
    if (reducedMotion.matches || document.hidden || hovered || focused || dragging || slides().length < 2) return;
    timer = setInterval(() => move(1), 4500);
  };
  const updateLanguage = () => {
    if (state.dataset.state === 'loading') state.textContent = words().loading_images;
    if (state.dataset.state === 'empty') state.textContent = words().samples_coming_soon;
    slides().forEach((slide, index) => slide.querySelector('img').alt = `${words().productSamples} ${index + 1}`);
  };

  previous.addEventListener('click', () => { move(-1); start(); });
  next.addEventListener('click', () => { move(1); start(); });
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
    start();
  });
  carousel.addEventListener('mouseenter', () => { hovered = true; stop(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; start(); });
  carousel.addEventListener('focusin', () => { focused = true; stop(); });
  carousel.addEventListener('focusout', () => { focused = false; start(); });
  track.addEventListener('pointerdown', () => { dragging = true; stop(); }, {passive:true});
  const finishDrag = () => { dragging = false; start(); };
  track.addEventListener('pointercancel', finishDrag, {passive:true});
  window.addEventListener('pointerup', finishDrag, {passive:true});
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reducedMotion.addEventListener?.('change', start);
  document.querySelectorAll('[data-lang]').forEach(button =>
    button.addEventListener('click', () => requestAnimationFrame(updateLanguage))
  );

  try {
    const paths = await getProductImages('product-samples');
    if (!paths.length) {
      state.dataset.state = 'empty';
      state.textContent = words().samples_coming_soon;
      previous.hidden = true;
      next.hidden = true;
      return;
    }
    state.hidden = true;
    paths.forEach((path, index) => {
      const slide = document.createElement('div');
      const image = document.createElement('img');
      slide.className = 'samples-slide';
      image.src = imageUrl(path);
      image.alt = `${words().productSamples} ${index + 1}`;
      image.loading = index < 3 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', () => image.classList.add('is-loaded'), {once:true});
      image.addEventListener('error', () => {
        slide.remove();
        if (!slides().length) {
          state.hidden = false;
          state.dataset.state = 'empty';
          state.textContent = words().samples_coming_soon;
        }
        const multiple = slides().length > 1;
        previous.hidden = !multiple;
        next.hidden = !multiple;
        start();
      }, {once:true});
      slide.append(image);
      track.append(slide);
    });
    const multiple = paths.length > 1;
    previous.hidden = !multiple;
    next.hidden = !multiple;
    start();
  } catch (error) {
    state.dataset.state = 'empty';
    state.textContent = words().samples_coming_soon;
    previous.hidden = true;
    next.hidden = true;
    console.warn('Product samples could not be loaded.', error);
  }
}

async function initializeProducts() {
  if (!productGrid) return;
  let manifest = {products:{}};
  try {
    manifest = await loadProductManifest();
  } catch (error) {
    console.warn('Product images could not be loaded.', error);
  }
  productGrid.innerHTML = productCatalog.map(product =>
    cardMarkup(product, manifest.products?.[product.id] || {})
  ).join('');
  productCatalog.forEach(product => {
    const card = document.getElementById(product.id);
    wireCard(card, product, manifest.products?.[product.id] || {});
  });
  document.querySelectorAll('[data-lang]').forEach(button =>
    button.addEventListener('click', () => requestAnimationFrame(updateDynamicLabels))
  );
}

function initializeOrderForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const category = form.querySelector('#product');
  const categoryField = category.closest('.field');
  const environmentField = form.querySelector('[data-order-environment]');
  const environment = form.querySelector('#environment');
  const modelField = form.querySelector('[data-screen-model-field]');
  const modelLegend = modelField.querySelector('legend');
  const modelState = form.querySelector('[data-screen-model-state]');
  const modelGrid = form.querySelector('[data-screen-model-grid]');
  const modelError = form.querySelector('[data-screen-model-error]');
  const formStatus = form.querySelector('.form-status');
  const splitCategories = new Set(productCatalog.filter(product => product.split).map(product => product.id));
  let modelRequest = 0;
  categoryField.classList.add('full');

  function clearModels() {
    modelRequest += 1;
    modelGrid.replaceChildren();
    modelState.textContent = '';
    modelError.textContent = '';
    modelField.hidden = true;
  }

  function categoryLabel() {
    return category.selectedOptions[0]?.textContent.trim() || category.value;
  }

  function modelAlt(index) {
    const environmentLabel = environmentField.hidden ? '' : ` ${environment.selectedOptions[0]?.textContent.trim() || ''}`;
    return `${categoryLabel()}${environmentLabel} ${words().screen_model_item} ${index}`;
  }

  function updateModelLabels() {
    const samples = category.value === 'product-samples';
    modelLegend.textContent = words()[samples ? 'choose_preferred_sample' : 'choose_screen_model'];
    modelGrid.querySelectorAll('.screen-model-option').forEach((option, index) => {
      option.querySelector('img').alt = modelAlt(index + 1);
      option.querySelector('.screen-model-selected').textContent = words().selected;
    });
    if (modelState.dataset.state === 'loading') modelState.textContent = words().loading_images;
    if (modelState.dataset.state === 'empty') modelState.textContent = words().no_images_category;
    if (modelError.textContent) modelError.textContent = words()[samples ? 'choose_sample_required' : 'choose_model_required'];
  }

  async function renderModels() {
    clearModels();
    const requestId = modelRequest;
    if (!category.value) return;
    const usesEnvironment = splitCategories.has(category.value);
    if (usesEnvironment && !environment.value) return;
    modelField.hidden = false;
    modelLegend.textContent = words()[category.value === 'product-samples' ? 'choose_preferred_sample' : 'choose_screen_model'];
    modelState.dataset.state = 'loading';
    modelState.textContent = words().loading_images;
    try {
      const paths = await getProductImages(category.value, usesEnvironment ? environment.value : null);
      if (requestId !== modelRequest) return;
      if (!paths.length) {
        modelState.dataset.state = 'empty';
        modelState.textContent = words().no_images_category;
        return;
      }
      modelState.textContent = '';
      modelState.dataset.state = '';
      paths.forEach((path, index) => {
        const input = document.createElement('input');
        const label = document.createElement('label');
        const image = document.createElement('img');
        const selected = document.createElement('span');
        input.type = 'radio';
        input.name = 'screenModel';
        input.value = path;
        input.id = `screen-model-${index + 1}`;
        input.dataset.modelIndex = String(index + 1);
        input.setAttribute('aria-checked', 'false');
        label.className = 'screen-model-option';
        label.htmlFor = input.id;
        image.src = imageUrl(path);
        image.alt = modelAlt(index + 1);
        image.loading = 'lazy';
        image.decoding = 'async';
        selected.className = 'screen-model-selected';
        selected.textContent = words().selected;
        label.append(input, image, selected);
        input.addEventListener('change', () => {
          modelGrid.querySelectorAll('input').forEach(radio => {
            radio.setAttribute('aria-checked', String(radio.checked));
            radio.closest('.screen-model-option').classList.toggle('selected', radio.checked);
          });
          modelError.textContent = '';
          formStatus.textContent = '';
        });
        image.addEventListener('load', () => image.classList.add('is-loaded'), {once:true});
        image.addEventListener('error', () => {
          label.remove();
          if (!modelGrid.children.length) {
            modelState.dataset.state = 'empty';
            modelState.textContent = words().no_images_category;
          }
        }, {once:true});
        modelGrid.append(label);
      });
    } catch (error) {
      if (requestId !== modelRequest) return;
      modelState.dataset.state = 'empty';
      modelState.textContent = words().no_images_category;
      console.warn('Order form product images could not be loaded.', error);
    }
  }

  category.addEventListener('change', () => {
    const usesEnvironment = splitCategories.has(category.value);
    categoryField.classList.toggle('full', !usesEnvironment);
    environmentField.hidden = !usesEnvironment;
    environment.required = usesEnvironment;
    environment.value = '';
    formStatus.textContent = '';
    clearModels();
    if (!usesEnvironment) renderModels();
  });
  environment.addEventListener('change', renderModels);
  document.querySelectorAll('[data-lang]').forEach(button =>
    button.addEventListener('click', () => requestAnimationFrame(updateModelLabels))
  );
  form.addEventListener('submit', event => {
    event.preventDefault();
    const selectedModel = form.querySelector('input[name="screenModel"]:checked');
    if (!form.checkValidity()) {
      formStatus.textContent = words().required;
      form.reportValidity();
      return;
    }
    if (!selectedModel) {
      const samples = category.value === 'product-samples';
      modelField.hidden = false;
      modelError.textContent = words()[samples ? 'choose_sample_required' : 'choose_model_required'];
      formStatus.textContent = modelError.textContent;
      return;
    }
    const data = new FormData(form);
    const labels = words();
    const selectedCategory = categoryLabel();
    const modelIndex = selectedModel.dataset.modelIndex;
    const localHost = /^(localhost|127(?:\.\d+){3})$/.test(location.hostname);
    const reference = localHost ? imageUrl(selectedModel.value) : new URL(imageUrl(selectedModel.value), document.baseURI).href;
    const lines = [
      'NEXAR — LED Display Request',
      `${labels.full_name}: ${data.get('name')}`,
      `${labels.phone}: ${data.get('phone')}`,
      `${labels.product_type}: ${selectedCategory}`
    ];
    if (!environmentField.hidden) lines.push(`${labels.environment}: ${environment.selectedOptions[0].textContent.trim()}`);
    lines.push(
      `${labels[category.value === 'product-samples' ? 'selected_sample' : 'selected_screen_model']}: ${labels.screen_model_item} ${modelIndex}`,
      `${labels.image_link}: ${reference}`,
      `${labels.width}: ${data.get('width')}`,
      `${labels.height}: ${data.get('height')}`,
      `${labels.city}: ${data.get('city')}`,
      `${labels.message}: ${data.get('message') || '-'}`
    );
    formStatus.textContent = '';
    window.open(`https://wa.me/${NEXAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSamplesCarousel();
    initializeProducts();
    initializeOrderForm();
  }, {once:true});
} else {
  initializeSamplesCarousel();
  initializeProducts();
  initializeOrderForm();
}

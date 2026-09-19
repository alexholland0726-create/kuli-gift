const $ = selector => document.querySelector(selector);
let token = sessionStorage.getItem('kuli_staff_token') || '';
let me = null, categories = [], productPage = 1;
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/admin/login') logout();
    throw new Error(Array.isArray(body.message) ? body.message.join('；') : body.message || '操作失败');
  }
  return body;
}
function esc(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function report(error) { $('#page-error').textContent = error.message || '操作失败，请重试'; }
async function run(action) { $('#page-error').textContent = ''; try { await action(); } catch (error) { report(error); } }
async function boot() {
  if (!token) return;
  try { me = await api('/api/admin/me'); } catch (error) { logout(); throw error; }
  $('#login').hidden = true; $('#app').hidden = false;
  $('#welcome').textContent = `${me.name} · ${me.role === 'owner' ? '管理员' : '产品编辑'}`;
  document.querySelectorAll('.owner-only').forEach(x => x.hidden = me.role !== 'owner');
  await showView('products');
}
function logout() {
  token = ''; me = null; categories = []; productPage = 1;
  sessionStorage.removeItem('kuli_staff_token');
  $('#product-dialog').close(); $('#app').hidden = true; $('#login').hidden = false;
  $('#login-form').elements.password.value = '';
}
$('#login-form').onsubmit = async event => {
  event.preventDefault(); $('#login-error').textContent = '';
  try {
    const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    token = result.token; sessionStorage.setItem('kuli_staff_token', token); await boot();
  } catch (error) { $('#login-error').textContent = error.message; report(error); }
};
$('#logout').onclick = logout;
async function showView(view) {
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x.dataset.view === view));
  document.querySelectorAll('.view').forEach(x => x.hidden = x.id !== view);
  $('#title').textContent = document.querySelector(`[data-view="${view}"]`).textContent;
  $('#new-product').hidden = view !== 'products';
  if (view === 'products') await loadProducts();
  if (view === 'categories') await loadCategories();
  if (view === 'inquiries') await loadInquiries();
  if (view === 'staff') await loadStaff();
}
document.querySelectorAll('.nav').forEach(button => button.onclick = () => run(() => showView(button.dataset.view)));
async function loadProducts() {
  const result = await api('/api/admin/products?page=' + productPage);
  $('#product-list').innerHTML = result.items.length ? result.items.map(p => `<article class="card"><img class="thumb" src="${esc(p.coverImage || '')}" alt=""><div class="grow"><b>${esc(p.name)}</b><div class="muted">${Number(p.price) > 0 ? '￥' + Number(p.price).toFixed(2) : '询价'} · ${esc(p.category?.name || '未分类')}</div></div><span class="badge ${p.isActive ? '' : 'off'}">${p.isActive ? '已上架' : '已下架 / 草稿'}</span><button class="secondary edit-product" data-id="${p.id}">编辑</button>${me.role === 'owner' && p.isActive ? `<button class="danger off-product" data-id="${p.id}">下架</button>` : ''}</article>`).join('') : '<div class="card">暂无产品，点击“上传产品”开始。</div>';
  document.querySelectorAll('.edit-product').forEach(b => b.onclick = () => run(() => editProduct(result.items.find(p => p.id == b.dataset.id))));
  document.querySelectorAll('.off-product').forEach(b => b.onclick = () => run(async () => {
    if (!confirm('确定下架该产品？产品资料会保留。')) return;
    await api('/api/products/' + b.dataset.id, { method: 'DELETE' }); await loadProducts();
  }));
  const pages = Math.max(1, Math.ceil(result.total / 50));
  $('#product-pagination').innerHTML = `<button id="prev-products" ${productPage <= 1 ? 'disabled' : ''}>上一页</button><span>第 ${productPage} / ${pages} 页 · 共 ${result.total} 个产品</span><button id="next-products" ${productPage >= pages ? 'disabled' : ''}>下一页</button>`;
  $('#prev-products').onclick = () => run(async () => { productPage--; await loadProducts(); });
  $('#next-products').onclick = () => run(async () => { productPage++; await loadProducts(); });
}
async function editProduct(product = { price: 0, stock: 0, isActive: false, isRecommended: false }) {
  categories = await api('/api/admin/categories');
  const form = $('#product-form'); form.reset();
  form.elements.categoryId.innerHTML = '<option value="">未分类</option>' + categories.map(c => `<option value="${c.id}" ${!c.isActive ? 'disabled' : ''}>${esc(c.name)}${c.isActive ? '' : '（已停用，请重选）'}</option>`).join('');
  for (const [key, value] of Object.entries(product)) {
    const input = form.elements[key]; if (!input) continue;
    if (input.type === 'checkbox') input.checked = !!value;
    else input.value = Array.isArray(value) ? value.join(',') : value ?? '';
  }
  form.elements.isActive.disabled = me.role !== 'owner' && !!product.isActive;
  $('#product-error').textContent = ''; $('#upload-status').textContent = '';
  $('#product-dialog').showModal();
}
$('#new-product').onclick = () => run(() => editProduct());
$('#close-dialog').onclick = $('#cancel-dialog').onclick = () => $('#product-dialog').close();
$('#cover-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  $('#upload-status').textContent = '上传中…';
  const save = $('#product-form button:not([type])'); save.disabled = true;
  try {
    const data = new FormData(); data.append('file', file);
    const result = await api('/api/upload', { method: 'POST', body: data });
    $('#product-form').elements.coverImage.value = result.url; $('#upload-status').textContent = '上传完成';
  } catch (error) { $('#upload-status').textContent = error.message; }
  finally { save.disabled = false; }
};
$('#product-form').onsubmit = async event => {
  event.preventDefault(); const form = event.target;
  const data = Object.fromEntries(new FormData(form)); const id = data.id; delete data.id;
  data.price = Number(data.price); data.stock = Number(data.stock || 0);
  data.categoryId = form.elements.categoryId.value ? Number(form.elements.categoryId.value) : null;
  data.tags = data.tags ? data.tags.split(/[,，]/).map(x => x.trim()).filter(Boolean) : [];
  data.isActive = form.elements.isActive.checked;
  if (id && me.role !== 'owner' && !data.isActive) delete data.isActive;
  data.isRecommended = form.elements.isRecommended.checked;
  // Editing category/status must preserve gallery, detail images and selling points.
  if (!id) { data.images = [data.coverImage]; data.detailImages = [data.coverImage]; }
  const save = form.querySelector('button:not([type])'); save.disabled = true;
  try {
    await api('/api/products' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
    $('#product-dialog').close(); await run(loadProducts);
  } catch (error) { $('#product-error').textContent = error.message; }
  finally { save.disabled = false; }
};
async function loadCategories() {
  categories = await api('/api/admin/categories');
  $('#category-list').innerHTML = categories.length ? categories.map(c => `<article class="card"><div class="grow"><b>${esc(c.name)}</b><div class="muted">排序 ${c.sort}${c.parentId ? ' · 子分类' : ''}</div></div><span class="badge ${c.isActive ? '' : 'off'}">${c.isActive ? '启用' : '停用'}</span><button class="secondary edit-category" data-id="${c.id}">编辑</button><button class="secondary toggle-category" data-id="${c.id}">${c.isActive ? '停用' : '启用'}</button></article>`).join('') : '<div class="card">暂无分类，请在上方新增。</div>';
  document.querySelectorAll('.edit-category').forEach(b => b.onclick = () => {
    const category = categories.find(c => c.id == b.dataset.id), form = $('#category-form');
    ['id', 'name', 'sort', 'isActive'].forEach(key => form.elements[key].value = String(category[key]));
    $('#category-error').textContent = ''; form.elements.name.focus();
  });
  document.querySelectorAll('.toggle-category').forEach(b => b.onclick = () => run(async () => {
    const category = categories.find(c => c.id == b.dataset.id);
    if (category.isActive && !confirm('停用后分类入口将隐藏，商品资料仍保留。确认停用？')) return;
    await api('/api/categories/' + category.id, { method: 'PUT', body: JSON.stringify({ isActive: !category.isActive }) });
    resetCategory(); await loadCategories();
  }));
}
function resetCategory() { $('#category-form').reset(); $('#category-form').elements.id.value = ''; $('#category-error').textContent = ''; }
$('#reset-category').onclick = resetCategory;
$('#category-form').onsubmit = async event => {
  event.preventDefault(); const form = event.target, id = form.elements.id.value;
  const data = { name: form.elements.name.value.trim(), sort: Number(form.elements.sort.value), isActive: form.elements.isActive.value === 'true' };
  const save = form.querySelector('button:not([type])'); save.disabled = true;
  try {
    await api('/api/categories' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
    resetCategory(); await run(loadCategories);
  } catch (error) { $('#category-error').textContent = error.message; }
  finally { save.disabled = false; }
};
async function loadInquiries() {
  const result = await api('/api/admin/inquiries');
  $('#inquiry-list').innerHTML = result.items.length ? result.items.map(x => `<article class="card"><div class="grow"><b>${esc(x.name)} · ${esc(x.contact)}</b><div>${esc(x.message)}</div><div class="muted">${x.products.map(p => esc(p.name) + ' × ' + p.quantity).join('；')} · ${new Date(x.createdAt).toLocaleString()}</div></div><select class="lead-status" data-id="${x.id}"><option value="new">新询价</option><option value="contacted">已联系</option><option value="closed">已完成</option></select></article>`).join('') : '<div class="card">暂无客户询价。</div>';
  document.querySelectorAll('.lead-status').forEach(select => {
    const inquiry = result.items.find(x => x.id == select.dataset.id); select.value = inquiry.status;
    select.onchange = async () => {
      select.disabled = true;
      try { await api('/api/admin/inquiries/' + select.dataset.id, { method: 'PUT', body: JSON.stringify({ status: select.value }) }); inquiry.status = select.value; }
      catch (error) { select.value = inquiry.status; report(error); }
      finally { select.disabled = false; }
    };
  });
}
async function loadStaff() {
  const result = await api('/api/admin/staff');
  $('#staff-list').innerHTML = result.map(x => `<article class="card"><div class="grow"><b>${esc(x.name)}</b><div class="muted">${esc(x.username)} · ${x.role === 'owner' ? '管理员' : '产品编辑'}</div></div><span class="badge ${x.active ? '' : 'off'}">${x.active ? '可登录' : '已停用'}</span>${x.role === 'editor' ? `<button class="secondary toggle-staff" data-id="${x.id}" data-active="${!x.active}">${x.active ? '停用' : '启用'}</button>` : ''}</article>`).join('');
  document.querySelectorAll('.toggle-staff').forEach(b => b.onclick = () => run(async () => {
    await api('/api/admin/staff/' + b.dataset.id, { method: 'PUT', body: JSON.stringify({ active: b.dataset.active === 'true' }) }); await loadStaff();
  }));
}
$('#staff-form').onsubmit = async event => { event.preventDefault(); await run(async () => { await api('/api/admin/staff', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); event.target.reset(); await loadStaff(); }); };
$('#password-form').onsubmit = async event => {
  event.preventDefault(); $('#password-error').textContent = '';
  try { await api('/api/admin/password', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); alert('密码已修改，请重新登录'); event.target.reset(); logout(); }
  catch (error) { $('#password-error').textContent = error.message; }
};
run(boot);

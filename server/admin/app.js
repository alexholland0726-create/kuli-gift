const $ = selector => document.querySelector(selector);
let token = sessionStorage.getItem('kuli_staff_token') || '';
let me = null, categories = [], productPage = 1, orderPage = 1;
const viewTitles = { dashboard: '工作台', products: '产品管理', categories: '分类管理', site: '首页装修', orders: '订单发货', inquiries: '客户询价', staff: '同事账号', account: '账号安全' };
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
  $('#side-name').textContent = me.name;
  $('#side-role').textContent = me.role === 'owner' ? '主管理员' : '运营编辑';
  $('#side-avatar').textContent = (me.name || '管').slice(0, 1);
  document.querySelectorAll('.owner-only').forEach(x => x.hidden = me.role !== 'owner');
  await showView('dashboard');
}
function logout() {
  token = ''; me = null; categories = []; productPage = 1; orderPage = 1;
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
  $('#title').textContent = viewTitles[view] || '管理后台';
  $('#new-product').hidden = view !== 'products';
  if (view === 'dashboard') await loadDashboard();
  if (view === 'products') await loadProducts();
  if (view === 'categories') await loadCategories();
  if (view === 'site') await loadSite();
  if (view === 'orders') await loadOrders();
  if (view === 'inquiries') await loadInquiries();
  if (view === 'staff') await loadStaff();
}
document.querySelectorAll('.nav').forEach(button => button.onclick = () => run(() => showView(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.onclick = () => run(() => showView(button.dataset.go)));
async function loadDashboard() {
  const requests = [api('/api/admin/products?page=1'), api('/api/admin/products?page=1&status=active'), api('/api/admin/categories'), api('/api/admin/inquiries?page=1'), api('/api/admin/orders?page=1'), api('/api/admin/products?page=1&status=inactive'), api('/api/admin/products?page=1&status=recommended')];
  if (me.role === 'owner') requests.push(api('/api/admin/staff'));
  const [allProducts, activeProducts, categoryRows, inquiryRows, orderRows, inactiveProducts, recommendedProducts, staffRows = []] = await Promise.all(requests);
  const newInquiries = inquiryRows.items.filter(item => item.status === 'new').length;
  const paidOrders = orderRows.items.filter(item => item.status === 'paid').length;
  $('#dashboard-stats').innerHTML = [
    ['产品总数', allProducts.total, `已上架 ${activeProducts.total}`, 'green'],
    ['产品分类', categoryRows.length, `启用 ${categoryRows.filter(item => item.isActive).length}`, 'gold'],
    ['待跟进询价', newInquiries, `全部 ${inquiryRows.total}`, 'blue'],
    ['待发货订单', paidOrders, `全部 ${orderRows.total}`, 'purple'],
    ...(me.role === 'owner' ? [['运营账号', staffRows.filter(item => item.active).length, `全部 ${staffRows.length}`, 'slate']] : []),
  ].map(([label, value, note, tone]) => `<article class="stat-card ${tone}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  const tasks = [
    { count: newInquiries, title: '条新询价等待联系', note: '及时响应能提高企业采购转化', view: 'inquiries', tone: 'urgent' },
    { count: paidOrders, title: '笔已付款订单等待发货', note: '录入物流后客户可查看配送进度', view: 'orders', tone: 'order' },
    { count: inactiveProducts.total, title: '个商品处于草稿或下架状态', note: '检查资料完整度后再决定是否上架', view: 'products', tone: 'catalog' },
  ];
  $('#dashboard-tasks').innerHTML = tasks.map(task => `<button class="task-item" data-go="${task.view}"><span class="task-icon ${task.tone}">${task.count}</span><span class="task-copy"><b>${task.title}</b><small>${task.note}</small></span><span class="task-arrow">→</span></button>`).join('');
  const productTotal = Math.max(1, allProducts.total);
  const activePercent = Math.round(activeProducts.total / productTotal * 100);
  const inactivePercent = Math.round(inactiveProducts.total / productTotal * 100);
  const recommendedPercent = Math.round(recommendedProducts.total / productTotal * 100);
  $('#dashboard-product-mix').innerHTML = `<div class="mix-visual" style="--active:${activePercent * 3.6}deg"><div><strong>${activePercent}%</strong><small>已上架</small></div></div><div class="mix-legend"><div><span class="legend-dot active"></span><b>已上架</b><em>${activeProducts.total}</em></div><div><span class="legend-dot inactive"></span><b>草稿 / 下架</b><em>${inactiveProducts.total}</em></div><div><span class="legend-dot recommended"></span><b>首页推荐</b><em>${recommendedProducts.total}</em></div></div><div class="coverage"><div><span>上架覆盖率</span><b>${activePercent}%</b></div><i><span style="width:${activePercent}%"></span></i><small>另有 ${inactivePercent}% 待整理，${recommendedPercent}% 已进入首页推荐</small></div>`;
  const activities = [
    ...inquiryRows.items.slice(0, 4).map(item => ({ type: '询价', title: `${item.name || '客户'} 提交了采购需求`, detail: item.products?.map(product => product.name).filter(Boolean).slice(0, 2).join('、') || item.message || '待查看需求', date: item.createdAt, tone: 'inquiry' })),
    ...orderRows.items.slice(0, 4).map(item => ({ type: '订单', title: `${item.orderNo} · ${orderStatusText(item.status)}`, detail: item.items?.map(product => product.name).filter(Boolean).slice(0, 2).join('、') || '订单商品', date: item.createdAt, tone: 'order' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  $('#dashboard-activity').innerHTML = activities.length ? activities.map(item => `<article class="activity-item"><span class="activity-type ${item.tone}">${item.type}</span><div><b>${esc(item.title)}</b><p>${esc(item.detail)}</p></div><time>${new Date(item.date).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></article>`).join('') : '<div class="empty-state"><b>暂时没有业务动态</b><p>新的询价和订单会显示在这里。</p></div>';
  document.querySelectorAll('#dashboard [data-go]').forEach(button => button.onclick = () => run(() => showView(button.dataset.go)));
}
async function loadProducts() {
  if (!categories.length) categories = await api('/api/admin/categories');
  const categorySelect = $('#product-category');
  const selectedCategory = categorySelect.value;
  categorySelect.innerHTML = '<option value="">全部分类</option>' + categories.map(c => `<option value="${c.id}">${esc(c.name)}${c.isActive ? '' : '（停用）'}</option>`).join('');
  categorySelect.value = selectedCategory;
  const params = new URLSearchParams({ page: String(productPage), status: $('#product-status').value || 'all' });
  const keyword = $('#product-keyword').value.trim();
  if (keyword) params.set('keyword', keyword);
  if (categorySelect.value) params.set('categoryId', categorySelect.value);
  const result = await api('/api/admin/products?' + params.toString());
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
$('#search-products').onclick = () => run(async () => { productPage = 1; await loadProducts(); });
$('#product-keyword').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); $('#search-products').click(); } };
$('#product-status').onchange = $('#product-category').onchange = () => run(async () => { productPage = 1; await loadProducts(); });
$('#reset-product-filter').onclick = () => run(async () => { $('#product-keyword').value = ''; $('#product-status').value = 'all'; $('#product-category').value = ''; productPage = 1; await loadProducts(); });
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
function nonEmptyLines(value) { return String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); }
async function loadSite() {
  const result = await api('/api/admin/site/home'), value = result.draft;
  const form = $('#site-form');
  form.elements.shareTitle.value = value.shareTitle;
  form.elements.notice.value = value.notice;
  form.elements.heroImage.value = value.heroImage;
  form.elements.quickEntries.value = value.quickEntries.map(x => `${x.name}|${x.categoryId}|${x.image}`).join('\n');
  form.elements.scenes.value = value.scenes.map(x => `${x.title}|${x.desc}|${x.categoryId}|${x.theme || 'festival'}`).join('\n');
  $('#site-status').textContent = `当前发布版本 ${result.version || 0}${result.updatedAt ? ' · 最近保存 ' + new Date(result.updatedAt).toLocaleString() : ''}`;
}
function sitePayload(form) {
  const quickEntries = nonEmptyLines(form.elements.quickEntries.value).map((line, index) => {
    const [name, category, image, ...extra] = line.split('|').map(x => x.trim());
    const categoryId = Number(category);
    if (!name || !image || extra.length || !Number.isInteger(categoryId) || categoryId < 1) throw new Error(`快捷入口第 ${index + 1} 行格式不正确`);
    return { name, categoryId, image };
  });
  const scenes = nonEmptyLines(form.elements.scenes.value).map((line, index) => {
    const [title, desc, category, theme, ...extra] = line.split('|').map(x => x.trim());
    const categoryId = Number(category);
    if (!title || !desc || !theme || extra.length || !Number.isInteger(categoryId) || categoryId < 1) throw new Error(`场景卡片第 ${index + 1} 行格式不正确`);
    return { title, desc, categoryId, theme };
  });
  return { shareTitle: form.elements.shareTitle.value.trim(), notice: form.elements.notice.value.trim(), heroImage: form.elements.heroImage.value.trim(), quickEntries, scenes };
}
$('#hero-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  $('#hero-upload-status').textContent = '上传中…';
  try {
    const data = new FormData(); data.append('file', file);
    const result = await api('/api/upload', { method: 'POST', body: data });
    $('#site-form').elements.heroImage.value = result.url; $('#hero-upload-status').textContent = '上传完成，保存并发布后生效';
  } catch (error) { $('#hero-upload-status').textContent = error.message; }
};
$('#site-form').onsubmit = async event => {
  event.preventDefault(); $('#site-error').textContent = '';
  try { await api('/api/admin/site/home/draft', { method: 'PUT', body: JSON.stringify(sitePayload(event.target)) }); $('#site-status').textContent = '草稿已保存，尚未发布'; }
  catch (error) { $('#site-error').textContent = error.message; }
};
$('#publish-site').onclick = () => run(async () => {
  const form = $('#site-form');
  await api('/api/admin/site/home/draft', { method: 'PUT', body: JSON.stringify(sitePayload(form)) });
  const result = await api('/api/admin/site/home/publish', { method: 'POST' });
  $('#site-status').textContent = `已发布版本 ${result.version}，小程序下次打开首页即生效`;
});
$('#restore-site').onclick = () => run(async () => { await api('/api/admin/site/home/restore', { method: 'POST' }); await loadSite(); });
const orderStatusText = value => ({ pending: '待付款', paid: '已付款', shipped: '已发货', delivered: '已送达', completed: '已完成', cancelled: '已取消', refunding: '退款中', refunded: '已退款' }[value] || value);
async function loadOrders() {
  const result = await api('/api/admin/orders?page=' + orderPage);
  $('#order-list').innerHTML = result.items.length ? result.items.map(order => `<article class="card"><div class="grow"><b>${esc(order.orderNo)} · ${orderStatusText(order.status)}</b><div>${order.items.map(item => `${esc(item.name)} × ${Number(item.quantity)}`).join('；')}</div><div class="muted">收货：${esc(order.consignee || '')} ${esc(order.phone || '')} · ${esc(order.address || '')}<br>金额 ￥${Number(order.payAmount).toFixed(2)} · ${new Date(order.createdAt).toLocaleString()}${order.trackingNo ? `<br>物流：${esc(order.trackingCompany)} ${esc(order.trackingNo)}` : ''}</div></div>${order.status === 'paid' ? `<button class="ship-order" data-id="${order.id}">录入发货</button>` : ''}</article>`).join('') : '<div class="card">暂无订单。</div>';
  document.querySelectorAll('.ship-order').forEach(button => button.onclick = () => run(async () => {
    const trackingCompany = prompt('物流公司名称'); if (!trackingCompany) return;
    const trackingNo = prompt('物流单号'); if (!trackingNo) return;
    await api('/api/admin/orders/' + button.dataset.id + '/ship', { method: 'PUT', body: JSON.stringify({ trackingCompany, trackingNo }) });
    await loadOrders();
  }));
  const pages = Math.max(1, Math.ceil(result.total / 50));
  $('#order-pagination').innerHTML = `<button id="prev-orders" ${orderPage <= 1 ? 'disabled' : ''}>上一页</button><span>第 ${orderPage} / ${pages} 页 · 共 ${result.total} 个订单</span><button id="next-orders" ${orderPage >= pages ? 'disabled' : ''}>下一页</button>`;
  $('#prev-orders').onclick = () => run(async () => { orderPage--; await loadOrders(); });
  $('#next-orders').onclick = () => run(async () => { orderPage++; await loadOrders(); });
}
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
